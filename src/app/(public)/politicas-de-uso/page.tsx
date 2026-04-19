export default function PoliticasDeUsoPage() {
  return (
    <main className="app-shell py-12">
      <div className="glass-panel rounded-[4px] p-8 max-w-4xl">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Documento legal</p>
        <h1 className="text-4xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="mt-3 text-sm text-muted">Vigência a partir de 1.º de janeiro de 2025 · Versão 1.0</p>

        <div className="mt-8 grid gap-8 text-sm leading-7 text-muted">

          <section>
            <h2 className="text-base font-semibold text-foreground">1. Aceitação</h2>
            <p className="mt-2">Ao acessar ou utilizar a plataforma R2BP MicroSaaS ("<strong>Plataforma</strong>"), o usuário ou a organização ("<strong>Cliente</strong>") declara ter lido, compreendido e aceitado integralmente estes Termos de Uso ("<strong>Termos</strong>"). Caso não concorde, interrompa imediatamente o uso. A aceitação ocorre no momento do primeiro acesso autenticado ou do aceite expresso durante o fluxo de cadastro.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p className="mt-2">A Plataforma é um sistema de gestão multi-tenant baseado em nuvem que oferece módulos de controle de acesso, agenda, suporte, gestão de usuários e funcionalidades configuráveis por organização. O acesso é fornecido como Software como Serviço (SaaS), sem transferência de licença de software ou entrega de código-fonte.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Cadastro e Conta</h2>
            <div className="mt-2 grid gap-2">
              <p>3.1. O Cliente é responsável pela veracidade e atualização das informações fornecidas no cadastro, incluindo razão social, CNPJ/CPF, dados do responsável legal e informações bancárias.</p>
              <p>3.2. Cada organização opera em ambiente isolado ("<strong>tenant</strong>"). O administrador do tenant responde pela gestão de usuários, convites, permissões e dados inseridos em seu escopo.</p>
              <p>3.3. Credenciais de acesso são pessoais e intransferíveis. O compartilhamento de senha é expressamente proibido. Em caso de suspeita de comprometimento, o usuário deve alterar a senha imediatamente e comunicar o suporte.</p>
              <p>3.4. A autenticação em dois fatores (2FA) pode ser exigida pela administração da Plataforma como requisito de segurança.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Obrigações do Usuário</h2>
            <div className="mt-2 grid gap-2">
              <p>O usuário obriga-se a:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li>Utilizar a Plataforma exclusivamente para fins lícitos e conforme sua finalidade;</li>
                <li>Não realizar engenharia reversa, scraping automatizado, ataques de força bruta ou qualquer tentativa de acesso não autorizado;</li>
                <li>Não inserir conteúdo ilegal, difamatório, discriminatório ou que viole direitos de terceiros;</li>
                <li>Manter o ambiente de acesso (dispositivo, rede) sob padrões razoáveis de segurança;</li>
                <li>Comunicar imediatamente qualquer vulnerabilidade identificada ao endereço de segurança disponível no rodapé da Plataforma.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Níveis de Acesso e Responsabilidades</h2>
            <div className="mt-2 grid gap-2">
              <p>5.1. <strong>Usuário comum:</strong> acessa somente seus próprios dados, sua agenda e seus tickets de suporte. Não possui visibilidade sobre outros usuários do tenant.</p>
              <p>5.2. <strong>Administrador do tenant:</strong> gerencia usuários, convites, permissões de funcionalidades e configurações do próprio tenant, sem acesso a dados de outros tenants.</p>
              <p>5.3. <strong>Administrador do sistema:</strong> possui visão global para fins de governança, suporte técnico, auditoria e segurança, com registro de todas as operações em trilha de auditoria imutável.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Disponibilidade e SLA</h2>
            <div className="mt-2 grid gap-2">
              <p>6.1. A Plataforma empenha esforços razoáveis para manter disponibilidade mínima de 99,5% ao mês, excluídas manutenções programadas comunicadas com antecedência mínima de 24 horas.</p>
              <p>6.2. Interrupções decorrentes de força maior, falhas de infraestrutura de terceiros (provedores de nuvem, operadoras de telecomunicações) ou ataques externos não configuram inadimplemento contratual.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Propriedade Intelectual</h2>
            <p className="mt-2">Todo o código-fonte, design, marca, logotipo, documentação e demais elementos da Plataforma são de propriedade exclusiva da R2BP ou de seus licenciadores. Nenhuma disposição destes Termos transfere ao Cliente qualquer direito de propriedade intelectual. Os dados inseridos pelo Cliente permanecem de sua titularidade, concedendo à R2BP licença limitada e não exclusiva para processá-los exclusivamente na prestação do serviço.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">8. Suspensão e Encerramento</h2>
            <div className="mt-2 grid gap-2">
              <p>8.1. A R2BP reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem prejuízo de outras medidas legais cabíveis.</p>
              <p>8.2. O Cliente pode solicitar o encerramento da conta a qualquer momento. Após a solicitação, os dados pessoais serão anonimizados ou excluídos no prazo de 30 dias, salvo obrigação legal de retenção.</p>
              <p>8.3. Saldos eventualmente devidos permanecem exigíveis independentemente do encerramento.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">9. Limitação de Responsabilidade</h2>
            <p className="mt-2">Na máxima extensão permitida pela legislação aplicável, a R2BP não se responsabiliza por danos indiretos, lucros cessantes, perda de dados ou danos consequentes decorrentes do uso ou da impossibilidade de uso da Plataforma. A responsabilidade total da R2BP perante o Cliente, em qualquer hipótese, fica limitada ao valor pago nos últimos 3 meses de contrato.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">10. Alterações nos Termos</h2>
            <p className="mt-2">Estes Termos podem ser atualizados periodicamente. Alterações materiais serão comunicadas por e-mail ou aviso na Plataforma com antecedência mínima de 15 dias. O uso continuado após a vigência das alterações implica aceitação tácita.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">11. Foro e Lei Aplicável</h2>
            <p className="mt-2">Estes Termos são regidos pelas leis da República Federativa do Brasil. As partes elegem o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, renunciando a qualquer outro, por mais privilegiado que seja, salvo disposição obrigatória em contrário.</p>
          </section>

          <section className="rounded-[4px] border border-border bg-surface-muted p-4">
            <p className="text-xs text-muted">Dúvidas sobre estes Termos? Entre em contato pelo e-mail <strong>juridico@r2bp.com.br</strong> ou abra um ticket de suporte na Plataforma.</p>
          </section>

        </div>
      </div>
    </main>
  );
}