# Make models a package so side-effect imports (for metadata) work.

from .auth_models import Usuario, ProfissionalUbs, LoginAttempt  # noqa: F401
from .diagnostico_models import (  # noqa: F401
    UBS,
    Service,
    UBSService,
    Indicator,
    ProfessionalGroup,
    TerritoryProfile,
    UBSNeeds,
)