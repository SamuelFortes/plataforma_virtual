import React from "react";

// High-fidelity "Diagnóstico Situacional da UBS" form page
export function DiagnosticoUBS() {
  return (
    <main className="diagnostico-page">
      <section className="diagnostico-card" aria-label="Formulário de diagnóstico situacional da UBS">
        {/* Header band */}
        <header className="diagnostico-header">
          <div className="diagnostico-header-content">
            <h1>Diagnóstico Situacional da UBS</h1>
            <p>
              Formulário para registro de dados do relatório situacional da Unidade Básica de Saúde
            </p>
          </div>
        </header>

        {/* SECTION 1 – Informações gerais da UBS */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Informações gerais da UBS</h2>
          </div>

          {/* Row 1 */}
          <div className="field-grid field-grid-3">
            <div className="form-field">
              <label className="field-label">
                Nome da UBS<span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="ESF 18 – Adalto Pereira Saraçayo"
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                CNES<span className="required">*</span>
              </label>
              <input type="text" className="field-input" placeholder="0000000" />
            </div>

            <div className="form-field field-span-2-lg">
              <label className="field-label">
                Área de atuação (bairros/localidades)<span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="Ex: Alto São Pedro, Nova Alvorada, Centro"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="field-grid field-grid-5 compact-row">
            <div className="form-field">
              <label className="field-label">
                Número de habitantes ativos<span className="required">*</span>
              </label>
              <input type="number" className="field-input" placeholder="Ex: 4.800" />
            </div>
            <div className="form-field">
              <label className="field-label">
                Número de microáreas<span className="required">*</span>
              </label>
              <input type="number" className="field-input" placeholder="Ex: 8" />
            </div>
            <div className="form-field">
              <label className="field-label">
                Número de famílias cadastradas<span className="required">*</span>
              </label>
              <input type="number" className="field-input" placeholder="Ex: 1.000" />
            </div>
            <div className="form-field">
              <label className="field-label">
                Número de domicílios<span className="required">*</span>
              </label>
              <input type="number" className="field-input" placeholder="Ex: 2.000" />
            </div>
            <div className="form-field">
              <label className="field-label">Domicílios rurais</label>
              <input type="number" className="field-input" placeholder="Ex: 15" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="field-grid field-grid-3">
            <div className="form-field">
              <label className="field-label">Data de inauguração</label>
              <div className="date-input-wrapper">
                <input type="date" className="field-input" placeholder="dd/mm/aaaa" />
                <span className="date-icon" aria-hidden="true">
	                  📅
                </span>
              </div>
            </div>
            <div className="form-field">
              <label className="field-label">Data da última reforma</label>
              <div className="date-input-wrapper">
                <input type="date" className="field-input" placeholder="dd/mm/aaaa" />
                <span className="date-icon" aria-hidden="true">
	                  📅
                </span>
              </div>
            </div>
            <div className="form-field">
              <label className="field-label">Gestão / modelo de atenção</label>
              <input type="text" className="field-input" placeholder="Ex: ESF, UBS tradicional, mista" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="form-field full-width">
            <label className="field-label">Descritivos gerais</label>
            <textarea
              className="field-input textarea"
              rows={3}
              placeholder="Perfil de referência – por exemplo, população prioritária, localização estratégica, etc."
            />
          </div>

          {/* Row 5 */}
          <div className="form-field full-width">
            <label className="field-label">Observações gerais</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Informações adicionais sobre a UBS, histórico, mudanças recentes na área de abrangência, projetos em andamento…"
            />
          </div>
        </section>

        {/* SECTION 2 – Serviços oferecidos pela UBS */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Serviços oferecidos pela UBS</h2>
            <p className="section-subtitle">
              Marque os serviços que a UBS oferece diretamente à população.
            </p>
          </div>

          <div className="services-grid">
            {[
              "Programa Saúde da Família",
              "Atendimento médico",
              "Atendimento de enfermagem",
              "Atendimento odontológico",
              "Atendimento de urgência / acolhimento",
              "Procedimentos (curativos, inalação, etc.)",
              "Sala de vacina",
              "Saúde da criança",
              "Saúde da mulher",
              "Saúde do homem",
              "Saúde do idoso",
              "Planejamento familiar",
              "Pré-natal",
              "Puericultura",
              "Atendimento a condições crônicas (hipertensão, diabetes, etc.)",
              "Programa Saúde na Escola (PSE)",
              "Saúde mental",
              "Atendimento multiprofissional (NASF ou equivalente)",
              "Testes rápidos de IST",
              "Vigilância epidemiológica",
              "Vigilância em saúde ambiental",
              "Visitas domiciliares",
              "Atividades coletivas e preventivas",
              "Grupos operativos (gestantes, tabagismo, etc.)",
            ].map((service) => (
              <label key={service} className="service-option">
                <input type="checkbox" />
                <span>{service}</span>
              </label>
            ))}
          </div>

          <div className="form-field full-width" style={{ marginTop: 20 }}>
            <label className="field-label">Outros serviços (especificar)</label>
            <input
              type="text"
              className="field-input"
              placeholder="Descreva outros serviços ofertados não listados acima…"
            />
          </div>
        </section>

        {/* SECTION 3 – Indicadores epidemiológicos */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Indicadores epidemiológicos</h2>
            <p className="section-subtitle">
              Preencha ou atualize os principais indicadores epidemiológicos da UBS. Todos os indicadores devem
              ser numéricos. Informe também o período de referência.
            </p>
          </div>

          <button type="button" className="link-button">
            Ver todos os indicadores cadastrados
          </button>

          <div className="indicator-list">
            <div className="indicator-row">
              <div className="indicator-main">
                <div className="indicator-title">Hipertensos cadastrados</div>
                <div className="indicator-meta">
                  Último valor: 325 – Período: 2023 Q1 – Fonte: Prontuário eletrônico
                </div>
              </div>
              <div className="indicator-actions">
                <span className="pill-badge">Tipo: Número absoluto</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>

            <div className="indicator-row">
              <div className="indicator-main">
                <div className="indicator-title">Diabéticos cadastrados</div>
                <div className="indicator-meta">
                  Último valor: 180 – Período: 2023 Q1 – Fonte: Prontuário eletrônico
                </div>
              </div>
              <div className="indicator-actions">
                <span className="pill-badge">Tipo: Número absoluto</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>

            <div className="indicator-row">
              <div className="indicator-main">
                <div className="indicator-title">Gestantes acompanhadas</div>
                <div className="indicator-meta">
                  Último valor: 42 – Período: 2023 Q1 – Fonte: e-SUS APS
                </div>
              </div>
              <div className="indicator-actions">
                <span className="pill-badge">Tipo: Taxa por 1.000 hab.</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>
          </div>

          <div className="subpanel">
            <div className="subpanel-header">
              <h3>Adicionar ou atualizar indicador</h3>
              <p className="section-subtitle small">
                Preencha os campos abaixo para cadastrar um novo indicador ou atualizar o valor de um indicador
                existente.
              </p>
            </div>

            <div className="field-grid field-grid-4">
              <div className="form-field field-span-2">
                <label className="field-label">
                  Nome do indicador<span className="required">*</span>
                </label>
                <input type="text" className="field-input" placeholder="Ex: Taxa de internação por AVC" />
              </div>

              <div className="form-field">
                <label className="field-label">
                  Tipo de dado<span className="required">*</span>
                </label>
                <select className="field-input">
                  <option value="">Selecionar</option>
                  <option value="absoluto">Número absoluto</option>
                  <option value="taxa">Taxa (%)</option>
                  <option value="taxa1000">Taxa por 1.000 hab.</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">
                  Grau de precisão do valor<span className="required">*</span>
                </label>
                <select className="field-input">
                  <option value="">Selecionar</option>
                  <option value="unidade">Unidade</option>
                  <option value="uma-casa">Uma casa decimal</option>
                  <option value="duas-casas">Duas casas decimais</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">
                  Valor<span className="required">*</span>
                </label>
                <input type="number" className="field-input" placeholder="Ex: 570 ou 79,5" />
              </div>

              <div className="form-field">
                <label className="field-label">
                  Período de referência<span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ex: 2023, 1º trimestre de 2023, Março/2023"
                />
              </div>
            </div>

            <div className="form-field full-width" style={{ marginTop: 16 }}>
              <label className="field-label">Observações (opcional)</label>
              <textarea
                className="field-input textarea"
                rows={3}
                placeholder="Informe fonte dos dados (e-SUS, SIAB, planilha própria, etc.), critérios de cálculo, estimativas utilizadas, comentários sobre mudanças bruscas de valor…"
              />
            </div>

            <div className="subpanel-actions">
              <button type="button" className="btn btn-outline">
                Limpar
              </button>
              <button type="button" className="btn btn-primary">
                Salvar indicador
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4 – Profissionais da equipe */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Profissionais da equipe</h2>
            <p className="section-subtitle">
              Consulte os profissionais já cadastrados e atualize conforme a composição da equipe da UBS.
            </p>
          </div>

          <div className="professional-list">
            <div className="professional-row">
              <div className="professional-main">
                <div className="professional-title">Agente Comunitário de Saúde (ACS)</div>
                <div className="professional-meta">Inclui ACS vinculados às microáreas da UBS.</div>
              </div>
              <div className="professional-actions">
                <span className="professional-qty">Quantidade: 8</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>

            <div className="professional-row">
              <div className="professional-main">
                <div className="professional-title">Enfermeiro da Família</div>
                <div className="professional-meta">
                  Profissional responsável pela coordenação da equipe.
                </div>
              </div>
              <div className="professional-actions">
                <span className="professional-qty">Quantidade: 1</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>

            <div className="professional-row">
              <div className="professional-main">
                <div className="professional-title">Médico da Estratégia de Saúde da Família</div>
                <div className="professional-meta">Profissional de referência para a população adstrita.</div>
              </div>
              <div className="professional-actions">
                <span className="professional-qty">Quantidade: 1</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>

            <div className="professional-row">
              <div className="professional-main">
                <div className="professional-title">Equipe de Referência (outros profissionais)</div>
                <div className="professional-meta">
                  Inclui outros profissionais vinculados à UBS (psicólogo, assistente social, farmacêutico, etc.).
                </div>
              </div>
              <div className="professional-actions">
                <span className="professional-qty">Quantidade: 4</span>
                <button type="button" className="link-button subtle">
                  Editar
                </button>
              </div>
            </div>
          </div>

          <button type="button" className="link-button" style={{ marginTop: 12 }}>
            Ver todos os profissionais cadastrados
          </button>

          <div className="subpanel" style={{ marginTop: 24 }}>
            <div className="subpanel-header">
              <h3>Adicionar ou atualizar profissional</h3>
              <p className="section-subtitle small">
                Informe o cargo/função, a quantidade de profissionais e o tipo de vínculo para adicionar um novo
                registro ou atualizar um já existente.
              </p>
            </div>

            <div className="field-grid field-grid-3">
              <div className="form-field field-span-2">
                <label className="field-label">
                  Cargo / função<span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Enfermeiro da Família, ACS, Técnico de Enfermagem, Farmacêutico, Psicólogo…"
                />
              </div>

              <div className="form-field">
                <label className="field-label">
                  Quantidade<span className="required">*</span>
                </label>
                <input type="number" className="field-input" placeholder="Ex: 2" />
              </div>

              <div className="form-field">
                <label className="field-label">
                  Tipo de vínculo<span className="required">*</span>
                </label>
                <select className="field-input">
                  <option value="">Selecionar</option>
                  <option value="concursado">Concursado</option>
                  <option value="contratado">Contratado</option>
                  <option value="residencia">Residência</option>
                  <option value="estagiario">Estagiário</option>
                </select>
              </div>
            </div>

            <div className="form-field full-width" style={{ marginTop: 16 }}>
              <label className="field-label">Observações (opcional)</label>
              <textarea
                className="field-input textarea"
                rows={3}
                placeholder="Informe categoria profissional, carga horária, se há programa de residência, se o profissional atende em mais de uma unidade, etc."
              />
            </div>

            <div className="subpanel-actions">
              <button type="button" className="btn btn-outline">
                Limpar
              </button>
              <button type="button" className="btn btn-primary">
                Salvar profissional
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 5 – Território e determinantes sociais */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Território e determinantes sociais</h2>
          </div>

          <div className="form-field full-width">
            <label className="field-label">
              Descrição do território<span className="required">*</span>
            </label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Descreva as principais características do território: perfil socioeconômico da população, presença de áreas urbanas e rurais, infraestrutura urbana (iluminação, pavimentação, saneamento), equipamentos sociais (escolas, CRAS, associações), áreas de risco, etc."
            />
          </div>

          <div className="form-field full-width">
            <label className="field-label">Potencialidades do território</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Registre parcerias existentes, lideranças comunitárias ativas, grupos organizados, empresas locais, programas sociais, projetos culturais, iniciativas de segurança, equipamentos de lazer, entre outros fatores positivos…"
            />
          </div>

          <div className="form-field full-width">
            <label className="field-label">Riscos e vulnerabilidades</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Informe situações de vulnerabilidade: áreas sujeitas a alagamentos, regiões com maior incidência de violência ou assaltos, terrenos baldios, pontos de descarte irregular de lixo, ausência de abastecimento de água, esgoto ou coleta regular, ocorrência de trabalho infantil, violência doméstica, população em situação de rua, doenças negligenciadas, etc."
            />
          </div>
        </section>

        {/* SECTION 6 – Problemas e necessidades da UBS */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Problemas e necessidades da UBS</h2>
          </div>

          <div className="form-field full-width">
            <label className="field-label">
              Problemas identificados<span className="required">*</span>
            </label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Descreva de forma detalhada os principais problemas identificados na UBS: deficiência ou má adequação do espaço físico (salas pequenas, falta de ventilação, barreiras arquitetônicas para pessoas com deficiência), sobrecarga de atendimentos, filas prolongadas, dificuldade de agendamento, ausência de protocolos definidos, alta rotatividade de profissionais, falta de integração entre equipes, fragilidade no acolhimento, dificuldades para realizar busca ativa, problemas de comunicação com a população, entre outros pontos críticos…"
            />
          </div>

          <div className="form-field full-width">
            <label className="field-label">Necessidades de equipamentos e insumos</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Liste os equipamentos, mobiliários e insumos necessários para o adequado funcionamento da unidade: computadores e impressoras, acesso à internet, cadeiras adequadas para sala de espera, mesas e armários, balanças, esfigmomanômetros, oxímetros, materiais para atendimento odontológico, materiais de limpeza, EPIs, kits de curativo, medicamentos essenciais, testes rápidos, etc."
            />
          </div>

          <div className="form-field full-width">
            <label className="field-label">Necessidades específicas dos ACS</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Registre necessidades identificadas para o trabalho dos Agentes Comunitários de Saúde: EPIs (máscaras, luvas, protetor solar, capa de chuva), materiais de campo (pranchetas, fichas, tablets ou smartphones), uniforme, crachá, boné, mochila, bicicleta ou outro meio de transporte, capacitações específicas, suporte para registro e envio de informações, entre outras."
            />
          </div>

          <div className="form-field full-width">
            <label className="field-label">Necessidades de infraestrutura e manutenção</label>
            <textarea
              className="field-input textarea"
              rows={4}
              placeholder="Descreva necessidades relacionadas à estrutura física e manutenção da UBS: reforma de telhado, substituição de portas e janelas, melhorias na acessibilidade (rampas, corrimãos, piso tátil), adequação elétrica e hidráulica, melhoria da ventilação ou climatização, ampliação de salas, pintura, paisagismo, poda de árvores no entorno, iluminação externa, sinalização interna, adequação de depósito de resíduos, entre outras."
            />
          </div>
        </section>

        {/* Bottom action bar */}
        <div className="bottom-action-bar">
          <button type="button" className="btn btn-outline">
            Salvar rascunho
          </button>
          <button type="button" className="btn btn-primary">
            Enviar diagnóstico
          </button>
        </div>
      </section>
    </main>
  );
}
