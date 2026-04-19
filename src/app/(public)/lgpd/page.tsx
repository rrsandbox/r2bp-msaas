export default function LgpdPage() {
  return (
    <main className="app-shell py-12">
      <div className="glass-panel rounded-[4px] p-8 max-w-4xl">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Documento legal</p>
        <h1 className="text-4xl font-semibold tracking-tight">Política de Privacidade e Proteção de Dados</h1>
        <p className="mt-3 text-sm text-muted">Em conformidade com a Lei n.º 13.709/2018 (LGPD) · Versão 1.0 · Vigência a partir de 1.º de janeiro de 2025</p>

        <div className="mt-8 grid gap-8 text-sm leading-7 text-muted">

          <section>
            <h2 className="text-base font-semibold text-foreground">1. Controlador de Dados</h2>
            <p className="mt-2">O controlador dos dados pessoais tratados na Plataforma R2BP MicroSaaS é a empresa responsável pela operação do serviço ("<strong>R2BP</strong>"), inscrita no CNPJ conforme contrato de prestação de serviços celebrado com o Cliente. O encarregado de proteção de dados (DPO) pode ser contatado pelo e-mail <strong>dpo@r2bp.com.br</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Dados Coletados</h2>
            <div className="mt-2 grid gap-3">
              <div>
                <p className="font-medium text-foreground/80">2.1. Dados de identificação e cadastro</p>
                <p>Nome completo, endereço de e-mail, CPF/CNPJ, RG, data de nascimento, telefone, endereço, CEP, cidade, estado, profissão e renda mensal (para pessoa física); razão social, nome fantasia, CNPJ, dados do responsável legal e dados bancários da pessoa jurídica (para pessoa jurídica).</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80">2.2. Dados de acesso e autenticação</p>
                <p>Endereço de e-mail, hash de senha (armazenado com algoritmo bcrypt, nunca em texto claro), tokens de autenticação em dois fatores, registros de sessão, endereço IP e user-agent do navegador.</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80">2.3. Dados operacionais</p>
                <p>Registros de auditoria de ações realizadas na Plataforma (criação, edição, exclusão de recursos), tickets de suporte, eventos de agenda, convites enviados e notificações.</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80">2.4. Dados financeiros (quando aplicável)</p>
                <p>Informações bancárias (banco, agência, conta, chave PIX) fornecidas voluntariamente pelo usuário para fins de integração com processos financeiros da organização. Não armazenamos dados de cartão de crédito diretamente.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Finalidade e Base Legal do Tratamento</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-left">
                    <th className="py-2 pr-4 font-medium text-foreground">Finalidade</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2 pr-4">Prestação do serviço e gestão de conta</td><td className="py-2">Art. 7.º, V — execução de contrato</td></tr>
                  <tr><td className="py-2 pr-4">Autenticação e segurança de acesso</td><td className="py-2">Art. 7.º, IX — legítimo interesse</td></tr>
                  <tr><td className="py-2 pr-4">Comunicações transacionais (convites, redefinição de senha, 2FA)</td><td className="py-2">Art. 7.º, V — execução de contrato</td></tr>
                  <tr><td className="py-2 pr-4">Auditoria e conformidade legal</td><td className="py-2">Art. 7.º, II — obrigação legal</td></tr>
                  <tr><td className="py-2 pr-4">Suporte técnico e resolução de incidentes</td><td className="py-2">Art. 7.º, IX — legítimo interesse</td></tr>
                  <tr><td className="py-2 pr-4">Melhoria e desenvolvimento da Plataforma</td><td className="py-2">Art. 7.º, IX — legítimo interesse</td></tr>
                  <tr><td className="py-2 pr-4">Comunicações de marketing (opt-in)</td><td className="py-2">Art. 7.º, I — consentimento</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Dados Sensíveis</h2>
            <div className="mt-2 grid gap-2">
              <p>A Plataforma pode tratar dados pessoais sensíveis conforme definido no art. 5.º, II da LGPD nas seguintes situações:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li><strong>Documentos de identificação</strong> (RG, CPF): coletados para verificação de identidade e conformidade com regulamentações financeiras/operacionais. Base legal: art. 11, II, "a" — cumprimento de obrigação legal.</li>
                <li><strong>Dados financeiros detalhados</strong> (renda, conta bancária): coletados sob consentimento expresso do titular para integração com processos internos da organização contratante.</li>
              </ul>
              <p>Dados sensíveis são armazenados com criptografia em repouso e acesso restrito por controle de papéis (RBAC). O usuário pode revogar o consentimento a qualquer momento via solicitação de exclusão de conta.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <div className="mt-2 grid gap-2">
              <p>Os dados pessoais não são vendidos ou cedidos a terceiros para fins comerciais. O compartilhamento ocorre exclusivamente nas seguintes situações:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li><strong>Infraestrutura de nuvem:</strong> provedores de hospedagem e banco de dados que operam como operadores de dados sob contrato de processamento (DPA) compatível com a LGPD;</li>
                <li><strong>Provedor de e-mail transacional:</strong> dados mínimos (endereço de e-mail, nome) compartilhados para envio de notificações operacionais;</li>
                <li><strong>Autoridades públicas:</strong> quando exigido por ordem judicial, requisição de autoridade competente ou obrigação legal;</li>
                <li><strong>Administrador do tenant:</strong> o administrador da organização à qual o usuário pertence tem acesso aos dados de perfil e registro de atividades de seus próprios usuários, limitado ao escopo do tenant.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Retenção e Exclusão</h2>
            <div className="mt-2 grid gap-2">
              <p>6.1. Os dados pessoais são retidos pelo período necessário à prestação do serviço e ao cumprimento de obrigações legais, em especial:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li>Dados cadastrais e de acesso: durante a vigência do contrato e até 5 anos após o encerramento, para fins de auditoria e obrigações fiscais;</li>
                <li>Registros de auditoria: mínimo de 1 ano, conforme boas práticas de segurança da informação;</li>
                <li>Dados de suporte: 2 anos após o fechamento do ticket.</li>
              </ul>
              <p>6.2. Ao solicitar exclusão de conta, os dados pessoais identificáveis são anonimizados ou deletados no prazo de 30 dias. Registros de auditoria podem ser mantidos de forma pseudonimizada para cumprir obrigações legais.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Direitos do Titular</h2>
            <div className="mt-2 grid gap-2">
              <p>Nos termos do art. 18 da LGPD, o titular tem direito a:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li><strong>Confirmação e acesso:</strong> saber quais dados são tratados e obter cópia;</li>
                <li><strong>Correção:</strong> solicitar correção de dados incompletos, inexatos ou desatualizados;</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários, excessivos ou tratados em desconformidade;</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável;</li>
                <li><strong>Revogação do consentimento:</strong> a qualquer momento, sem prejuízo da licitude do tratamento anterior;</li>
                <li><strong>Oposição:</strong> ao tratamento baseado em legítimo interesse, em caso de descumprimento da LGPD;</li>
                <li><strong>Petição à ANPD:</strong> direito de recorrer à Autoridade Nacional de Proteção de Dados.</li>
              </ul>
              <p>Para exercer seus direitos, entre em contato pelo e-mail <strong>privacidade@r2bp.com.br</strong> ou pela funcionalidade "Solicitar exclusão de conta" disponível no seu perfil. O prazo de resposta é de até 15 dias corridos.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">8. Segurança</h2>
            <div className="mt-2 grid gap-2">
              <p>A R2BP adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda, destruição ou divulgação, incluindo:</p>
              <ul className="list-disc pl-5 grid gap-1">
                <li>Criptografia de senhas com bcrypt (fator de custo mínimo 10);</li>
                <li>Comunicação exclusivamente via HTTPS/TLS 1.2+;</li>
                <li>Controle de acesso baseado em papéis (RBAC) com princípio do menor privilégio;</li>
                <li>Autenticação em dois fatores (2FA) disponível e incentivada;</li>
                <li>Trilha de auditoria imutável de todas as operações sensíveis;</li>
                <li>Isolamento de dados por tenant (multi-tenancy seguro).</li>
              </ul>
              <p>Incidentes de segurança que possam gerar risco ou dano a titulares serão comunicados à ANPD e aos afetados nos prazos previstos na LGPD.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">9. Cookies e Rastreamento</h2>
            <p className="mt-2">A Plataforma utiliza cookies estritamente necessários para manutenção da sessão autenticada e preferências de interface (tema claro/escuro). Não utilizamos cookies de rastreamento ou publicidade comportamental. O usuário pode gerenciar cookies pelo navegador, ciente de que a desativação de cookies de sessão impedirá o uso da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">10. Transferência Internacional</h2>
            <p className="mt-2">Os dados podem ser processados em servidores localizados fora do Brasil exclusivamente por provedores de infraestrutura que ofereçam nível de proteção adequado ou que tenham celebrado cláusulas contratuais padrão compatíveis com a LGPD, conforme art. 33 da Lei n.º 13.709/2018.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">11. Atualizações desta Política</h2>
            <p className="mt-2">Esta Política pode ser revisada periodicamente. Alterações relevantes serão comunicadas por e-mail ou aviso na Plataforma com antecedência mínima de 15 dias. A versão vigente estará sempre disponível nesta página com a data de atualização.</p>
          </section>

          <section className="rounded-[4px] border border-border bg-surface-muted p-4">
            <p className="font-medium text-foreground text-xs mb-1">Encarregado de Proteção de Dados (DPO)</p>
            <p className="text-xs text-muted">E-mail: <strong>dpo@r2bp.com.br</strong> · Para exercício de direitos: <strong>privacidade@r2bp.com.br</strong></p>
            <p className="text-xs text-muted mt-1">Autoridade Nacional de Proteção de Dados (ANPD): <strong>www.gov.br/anpd</strong></p>
          </section>

        </div>
      </div>
    </main>
  );
}