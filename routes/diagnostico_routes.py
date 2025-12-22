from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db
from models.diagnostico_models import (
    UBS,
    Service,
    UBSService,
    Indicator,
    ProfessionalGroup,
    TerritoryProfile,
    UBSNeeds,
)
from models.auth_models import Usuario
from schemas.diagnostico_schemas import (
    UBSCreate,
    UBSUpdate,
    UBSOut,
    PaginatedUBS,
    UBSServicesPayload,
    UBSServicesOut,
    ServicesCatalogItem,
    IndicatorCreate,
    IndicatorUpdate,
    IndicatorOut,
    ProfessionalGroupCreate,
    ProfessionalGroupUpdate,
    ProfessionalGroupOut,
    TerritoryProfileCreate,
    TerritoryProfileUpdate,
    TerritoryProfileOut,
    UBSNeedsCreate,
    UBSNeedsUpdate,
    UBSNeedsOut,
    UBSStatus,
    FullDiagnosisOut,
    UBSSubmissionMetadata,
    ValidationErrorResponse,
    ErrorDetail,
    UBSSubmitRequest,
)
from utils.deps import get_current_active_user


diagnostico_router = APIRouter(prefix="/ubs", tags=["diagnostico"])


async def _get_ubs_or_404(
    ubs_id: int,
    current_user: Usuario,
    db: AsyncSession,
) -> UBS:
    result = await db.execute(
        select(UBS).where(
            UBS.id == ubs_id,
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    ubs = result.scalar_one_or_none()
    if not ubs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="UBS não encontrada")
    return ubs


# ----------------------- UBS general information -----------------------


@diagnostico_router.post("", response_model=UBSOut, status_code=status.HTTP_201_CREATED)
async def create_ubs(
    payload: UBSCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = UBS(
        tenant_id=current_user.id,
        owner_user_id=current_user.id,
        nome_relatorio=payload.nome_relatorio,
        nome_ubs=payload.nome_ubs,
        cnes=payload.cnes,
        area_atuacao=payload.area_atuacao,
        numero_habitantes_ativos=payload.numero_habitantes_ativos or 0,
        numero_microareas=payload.numero_microareas or 0,
        numero_familias_cadastradas=payload.numero_familias_cadastradas or 0,
        numero_domicilios=payload.numero_domicilios or 0,
        domicilios_rurais=payload.domicilios_rurais,
        data_inauguracao=payload.data_inauguracao,
        data_ultima_reforma=payload.data_ultima_reforma,
        descritivos_gerais=payload.descritivos_gerais,
        observacoes_gerais=payload.observacoes_gerais,
        outros_servicos=payload.outros_servicos,
        status=UBSStatus.DRAFT.value,
    )
    db.add(ubs)
    await db.commit()
    await db.refresh(ubs)
    return ubs


@diagnostico_router.get("", response_model=PaginatedUBS)
async def list_ubs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    offset = (page - 1) * page_size

    total_result = await db.execute(
        select(func.count(UBS.id)).where(
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(UBS)
        .where(UBS.tenant_id == current_user.id, UBS.is_deleted.is_(False))
        .order_by(UBS.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()
    return PaginatedUBS(items=items, total=total, page=page, page_size=page_size)


@diagnostico_router.get("/{ubs_id}", response_model=UBSOut)
async def get_ubs(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)
    return ubs


@diagnostico_router.patch("/{ubs_id}", response_model=UBSOut)
async def update_ubs(
    ubs_id: int,
    payload: UBSUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ubs, field, value)

    await db.commit()
    await db.refresh(ubs)
    return ubs


@diagnostico_router.delete("/{ubs_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_ubs(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)
    ubs.is_deleted = True
    await db.commit()
    return None


# ----------------------- Services -----------------------


@diagnostico_router.get("/services/catalog", response_model=List[ServicesCatalogItem])
async def get_services_catalog(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),  # noqa: ARG001 (forces auth)
):
    result = await db.execute(select(Service))
    return result.scalars().all()


@diagnostico_router.get("/{ubs_id}/services", response_model=UBSServicesOut)
async def get_ubs_services(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(
        select(Service)
        .join(UBSService, UBSService.service_id == Service.id)
        .where(UBSService.ubs_id == ubs.id)
        .order_by(Service.name)
    )
    services = result.scalars().all()

    return UBSServicesOut(services=services, outros_servicos=ubs.outros_servicos)


@diagnostico_router.patch("/{ubs_id}/services", response_model=UBSServicesOut)
async def update_ubs_services(
    ubs_id: int,
    payload: UBSServicesPayload,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    # Clear existing links and recreate to match payload
    await db.execute(
        UBSService.__table__.delete().where(UBSService.ubs_id == ubs.id)
    )

    if payload.service_ids:
        result = await db.execute(
            select(Service).where(Service.id.in_(payload.service_ids))
        )
        found_services = {s.id: s for s in result.scalars().all()}

        missing_ids = [sid for sid in payload.service_ids if sid not in found_services]
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Serviços não encontrados para ids: {missing_ids}",
            )

        for sid in payload.service_ids:
            link = UBSService(ubs_id=ubs.id, service_id=sid)
            db.add(link)

    ubs.outros_servicos = payload.outros_servicos

    await db.commit()

    result = await db.execute(
        select(Service)
        .join(UBSService, UBSService.service_id == Service.id)
        .where(UBSService.ubs_id == ubs.id)
        .order_by(Service.name)
    )
    services = result.scalars().all()

    return UBSServicesOut(services=services, outros_servicos=ubs.outros_servicos)


# ----------------------- Indicators -----------------------


@diagnostico_router.get("/{ubs_id}/indicators", response_model=List[IndicatorOut])
async def list_indicators(
    ubs_id: int,
    tipo_dado: Optional[str] = Query(None),
    periodo: Optional[str] = Query(None, alias="periodo_referencia"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    stmt = select(Indicator).where(Indicator.ubs_id == ubs.id)
    if tipo_dado:
        stmt = stmt.where(Indicator.tipo_dado == tipo_dado)
    if periodo:
        stmt = stmt.where(Indicator.periodo_referencia == periodo)

    result = await db.execute(stmt.order_by(Indicator.created_at.desc(), Indicator.id.desc()))
    return result.scalars().all()


@diagnostico_router.post("/{ubs_id}/indicators", response_model=IndicatorOut, status_code=status.HTTP_201_CREATED)
async def create_indicator(
    ubs_id: int,
    payload: IndicatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    indicator = Indicator(
        ubs_id=ubs.id,
        nome_indicador=payload.nome_indicador,
        tipo_dado=payload.tipo_dado.value,
        grau_precisao_valor=payload.grau_precisao_valor.value,
        valor=payload.valor,
        periodo_referencia=payload.periodo_referencia,
        observacoes=payload.observacoes,
        created_by=current_user.id,
    )
    db.add(indicator)
    await db.commit()
    await db.refresh(indicator)
    return indicator


@diagnostico_router.get("/indicators/{indicator_id}", response_model=IndicatorOut)
async def get_indicator(
    indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Indicator).join(UBS).where(
            Indicator.id == indicator_id,
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    indicator = result.scalar_one_or_none()
    if not indicator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Indicador não encontrado")
    return indicator


@diagnostico_router.patch("/indicators/{indicator_id}", response_model=IndicatorOut)
async def update_indicator(
    indicator_id: int,
    payload: IndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Indicator).join(UBS).where(
            Indicator.id == indicator_id,
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    indicator = result.scalar_one_or_none()
    if not indicator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Indicador não encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    if "tipo_dado" in update_data and update_data["tipo_dado"] is not None:
        update_data["tipo_dado"] = update_data["tipo_dado"].value
    if "grau_precisao_valor" in update_data and update_data["grau_precisao_valor"] is not None:
        update_data["grau_precisao_valor"] = update_data["grau_precisao_valor"].value

    for field, value in update_data.items():
        setattr(indicator, field, value)

    indicator.updated_by = current_user.id

    await db.commit()
    await db.refresh(indicator)
    return indicator


# ----------------------- Professional groups -----------------------


@diagnostico_router.get("/{ubs_id}/professionals", response_model=List[ProfessionalGroupOut])
async def list_professional_groups(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(
        select(ProfessionalGroup)
        .where(ProfessionalGroup.ubs_id == ubs.id)
        .order_by(ProfessionalGroup.cargo_funcao)
    )
    return result.scalars().all()


@diagnostico_router.post("/{ubs_id}/professionals", response_model=ProfessionalGroupOut, status_code=status.HTTP_201_CREATED)
async def create_professional_group(
    ubs_id: int,
    payload: ProfessionalGroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    group = ProfessionalGroup(
        ubs_id=ubs.id,
        cargo_funcao=payload.cargo_funcao,
        quantidade=payload.quantidade,
        tipo_vinculo=payload.tipo_vinculo,
        observacoes=payload.observacoes,
        created_by=current_user.id,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@diagnostico_router.get("/professionals/{group_id}", response_model=ProfessionalGroupOut)
async def get_professional_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ProfessionalGroup).join(UBS).where(
            ProfessionalGroup.id == group_id,
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado")
    return group


@diagnostico_router.patch("/professionals/{group_id}", response_model=ProfessionalGroupOut)
async def update_professional_group(
    group_id: int,
    payload: ProfessionalGroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ProfessionalGroup).join(UBS).where(
            ProfessionalGroup.id == group_id,
            UBS.tenant_id == current_user.id,
            UBS.is_deleted.is_(False),
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    group.updated_by = current_user.id

    await db.commit()
    await db.refresh(group)
    return group


# ----------------------- Territory profile -----------------------


@diagnostico_router.get("/{ubs_id}/territory", response_model=TerritoryProfileOut)
async def get_territory_profile(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(
        select(TerritoryProfile).where(TerritoryProfile.ubs_id == ubs.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de território não encontrado")
    return profile


@diagnostico_router.put("/{ubs_id}/territory", response_model=TerritoryProfileOut)
async def upsert_territory_profile(
    ubs_id: int,
    payload: TerritoryProfileCreate | TerritoryProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(
        select(TerritoryProfile).where(TerritoryProfile.ubs_id == ubs.id)
    )
    profile = result.scalar_one_or_none()

    data = payload.model_dump(exclude_unset=True)

    if profile:
        for field, value in data.items():
            setattr(profile, field, value)
        profile.updated_by = current_user.id
    else:
        if "descricao_territorio" not in data or not data["descricao_territorio"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo descricao_territorio é obrigatório",
            )
        profile = TerritoryProfile(
            ubs_id=ubs.id,
            descricao_territorio=data["descricao_territorio"],
            potencialidades_territorio=data.get("potencialidades_territorio"),
            riscos_vulnerabilidades=data.get("riscos_vulnerabilidades"),
            created_by=current_user.id,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


# ----------------------- UBS needs -----------------------


@diagnostico_router.get("/{ubs_id}/needs", response_model=UBSNeedsOut)
async def get_ubs_needs(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(select(UBSNeeds).where(UBSNeeds.ubs_id == ubs.id))
    needs = result.scalar_one_or_none()
    if not needs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de necessidades não encontrado")
    return needs


@diagnostico_router.put("/{ubs_id}/needs", response_model=UBSNeedsOut)
async def upsert_ubs_needs(
    ubs_id: int,
    payload: UBSNeedsCreate | UBSNeedsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    result = await db.execute(select(UBSNeeds).where(UBSNeeds.ubs_id == ubs.id))
    needs = result.scalar_one_or_none()

    data = payload.model_dump(exclude_unset=True)

    if needs:
        for field, value in data.items():
            setattr(needs, field, value)
        needs.updated_by = current_user.id
    else:
        if "problemas_identificados" not in data or not data["problemas_identificados"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo problemas_identificados é obrigatório",
            )
        needs = UBSNeeds(
            ubs_id=ubs.id,
            problemas_identificados=data["problemas_identificados"],
            necessidades_equipamentos_insumos=data.get("necessidades_equipamentos_insumos"),
            necessidades_especificas_acs=data.get("necessidades_especificas_acs"),
            necessidades_infraestrutura_manutencao=data.get("necessidades_infraestrutura_manutencao"),
            created_by=current_user.id,
        )
        db.add(needs)

    await db.commit()
    await db.refresh(needs)
    return needs


# ----------------------- Submission workflow -----------------------


def _validate_before_submit(ubs: UBS) -> list[ErrorDetail]:
    errors: list[ErrorDetail] = []

    def add(field: str, msg: str, code: str = "invalid") -> None:
        errors.append(ErrorDetail(field=field, message=msg, code=code))

    # General info required
    if not ubs.nome_ubs:
        add("nome_ubs", "Nome da UBS é obrigatório", "required")
    if not ubs.cnes:
        add("cnes", "CNES é obrigatório", "required")
    if not ubs.area_atuacao:
        add("area_atuacao", "Área de atuação é obrigatória", "required")

    for field in [
        "numero_habitantes_ativos",
        "numero_microareas",
        "numero_familias_cadastradas",
        "numero_domicilios",
    ]:
        if getattr(ubs, field) is None:
            add(field, "Campo numérico obrigatório para envio", "required")
        elif getattr(ubs, field) < 0:
            add(field, "Valor não pode ser negativo", "range")

    # Territory profile
    if not ubs.territory_profile or not ubs.territory_profile.descricao_territorio:
        add("territory_profile.descricao_territorio", "Descrição do território é obrigatória", "required")

    # UBS needs
    if not ubs.needs or not ubs.needs.problemas_identificados:
        add("needs.problemas_identificados", "Problemas identificados são obrigatórios", "required")

    # Simple date consistency check
    if ubs.data_inauguracao and ubs.data_ultima_reforma:
        if ubs.data_ultima_reforma < ubs.data_inauguracao:
            add(
                "data_ultima_reforma",
                "Data da última reforma não pode ser anterior à data de inauguração",
                "date_logic",
            )

    return errors


@diagnostico_router.post(
    "/{ubs_id}/submit",
    response_model=FullDiagnosisOut,
    responses={
        400: {"model": ValidationErrorResponse},
    },
)
async def submit_diagnosis(
    ubs_id: int,
    payload: UBSSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    # Load related entities for validation and response
    await db.refresh(
        ubs,
        attribute_names=[
            "territory_profile",
            "needs",
            "services",
            "indicators",
            "professional_groups",
        ],
    )

    errors = _validate_before_submit(ubs)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "Falha na validação para envio do diagnóstico",
                "errors": [e.model_dump() for e in errors],
            },
        )

    ubs.status = UBSStatus.SUBMITTED.value
    from datetime import datetime as dt

    ubs.submitted_at = dt.utcnow()
    ubs.submitted_by = current_user.id

    await db.commit()
    await db.refresh(ubs)

    # Reuse aggregation endpoint implementation
    return await get_full_diagnosis(ubs_id=ubs.id, db=db, current_user=current_user)


# ----------------------- Aggregated diagnosis read model -----------------------


@diagnostico_router.get("/{ubs_id}/diagnosis", response_model=FullDiagnosisOut)
async def get_full_diagnosis(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    ubs = await _get_ubs_or_404(ubs_id, current_user, db)

    # Load relationships efficiently
    result = await db.execute(
        select(UBS)
        .options(
            selectinload(UBS.services).selectinload(UBSService.service),
            selectinload(UBS.indicators),
            selectinload(UBS.professional_groups),
            selectinload(UBS.territory_profile),
            selectinload(UBS.needs),
        )
        .where(UBS.id == ubs.id)
    )
    ubs_obj: UBS = result.scalar_one()

    # Services
    services_items: List[ServicesCatalogItem] = [
        ServicesCatalogItem(id=link.service.id, name=link.service.name)
        for link in sorted(ubs_obj.services, key=lambda l: l.service.name)
    ]
    services_out = UBSServicesOut(services=services_items, outros_servicos=ubs_obj.outros_servicos)

    # Latest indicator per nome_indicador
    indicators_sorted = sorted(
        ubs_obj.indicators,
        key=lambda i: (i.nome_indicador, i.created_at or i.id),
    )
    latest_by_name: dict[str, Indicator] = {}
    for ind in indicators_sorted:
        latest_by_name[ind.nome_indicador] = ind

    indicators_latest: List[IndicatorOut] = [
        IndicatorOut(
            id=ind.id,
            ubs_id=ind.ubs_id,
            nome_indicador=ind.nome_indicador,
            tipo_dado=ind.tipo_dado,
            grau_precisao_valor=ind.grau_precisao_valor,
            valor=float(ind.valor),
            periodo_referencia=ind.periodo_referencia,
            observacoes=ind.observacoes,
            created_at=ind.created_at,
            updated_at=ind.updated_at,
        )
        for ind in latest_by_name.values()
    ]

    # Professional groups
    professionals_out: List[ProfessionalGroupOut] = [
        ProfessionalGroupOut.model_validate(pg) for pg in ubs_obj.professional_groups
    ]

    # Territory and needs
    territory_out = (
        TerritoryProfileOut.model_validate(ubs_obj.territory_profile)
        if ubs_obj.territory_profile
        else None
    )
    needs_out = UBSNeedsOut.model_validate(ubs_obj.needs) if ubs_obj.needs else None

    submission_meta = UBSSubmissionMetadata(
        status=UBSStatus(ubs_obj.status),
        submitted_at=ubs_obj.submitted_at,
        submitted_by=ubs_obj.submitted_by,
    )

    ubs_out = UBSOut.model_validate(ubs_obj)

    return FullDiagnosisOut(
        ubs=ubs_out,
        services=services_out,
        indicators_latest=indicators_latest,
        professional_groups=professionals_out,
        territory_profile=territory_out,
        needs=needs_out,
        submission=submission_meta,
    )
