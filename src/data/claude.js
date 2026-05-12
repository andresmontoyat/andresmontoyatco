export const VALUES = [
  {
    id: '01',
    key: 'velocity',
    desc: {
      en: 'Agentic workflows (discuss → plan → execute → verify) ship in hours what takes days traditionally, while preserving atomic commits and real tests.',
      es: 'Workflows agénticos (discuss → plan → execute → verify) entregan en horas lo que toma días con desarrollo tradicional, manteniendo atomic commits y tests reales.',
    },
  },
  {
    id: '02',
    key: 'discipline',
    desc: {
      en: 'Hexagonal architecture, ports & adapters, ArchUnit gates and ADRs are non-negotiable — agentic speed never comes at the cost of structure.',
      es: 'Hexagonal architecture, ports & adapters, ArchUnit gates y ADRs no se negocian — la velocidad agéntica nunca sacrifica estructura.',
    },
  },
  {
    id: '03',
    key: 'quality',
    desc: {
      en: 'Tests (JUnit, Karate, Testcontainers), structured logging and OpenTelemetry tracing are wired from day one, not bolted on later.',
      es: 'Tests (JUnit, Karate, Testcontainers), structured logging y tracing con OpenTelemetry quedan cableados desde el día uno, no parchados después.',
    },
  },
  {
    id: '04',
    key: 'transfer',
    desc: {
      en: "I leave your team the workflow, not a black box: the agents, skills and guidelines stay in your repo and your engineers keep using them after I'm gone.",
      es: 'Le dejo a tu equipo el workflow, no una caja negra: los agents, skills y guidelines quedan en tu repo y tus ingenieros los siguen usando cuando yo no esté.',
    },
  },
]

export const SERVICES = [
  {
    key: 'greenfield',
    desc: {
      en: 'Spring Boot + hexagonal from scratch with CI/CD, observability and complete testing infra.',
      es: 'Spring Boot + hexagonal desde cero, con CI/CD, observability y testing infra completas.',
    },
  },
  {
    key: 'aiSetup',
    desc: {
      en: 'Custom agents, skills and slash-commands tailored to your codebase so your team adopts the workflow on day one.',
      es: 'Subagents, skills y slash-commands a medida de tu codebase para que tu equipo adopte el workflow desde el primer día.',
    },
  },
  {
    key: 'mcp',
    desc: {
      en: 'Model Context Protocol servers in Java/Kotlin with Spring AI that connect Claude to your internal systems.',
      es: 'Servidores Model Context Protocol en Java/Kotlin con Spring AI que conectan Claude a tus sistemas internos.',
    },
  },
  {
    key: 'legacy',
    desc: {
      en: 'Strangler-fig refactor of legacy Spring/Java services toward hexagonal architecture, with full test coverage and zero downtime.',
      es: 'Refactor strangler-fig de servicios Spring/Java legacy hacia hexagonal architecture, con cobertura completa de tests y cero downtime.',
    },
  },
  {
    key: 'devops',
    desc: {
      en: 'Production-ready GitHub Actions templates + GitFlow + multi-cloud deploys (EC2, VPN-tunneled EC2, EKS) backed by the soldife/ci-templates toolkit.',
      es: 'Templates de GitHub Actions listos para producción + GitFlow + deploys multi-cloud (EC2, EC2 sobre VPN, EKS) respaldados por el toolkit soldife/ci-templates.',
    },
  },
]

export const APPS = [
  {
    slug: 'ci-templates',
    name: 'ci-templates',
    tag: 'OPEN SOURCE',
    desc: {
      en: '47 reusable GitHub Actions workflows + 15 starter templates (Java, Krakend, React). GitFlow strategy, quality gates (SonarQube · OWASP · ArchUnit · Qodana), deploys EC2 / EC2-over-WireGuard-VPN / EKS.',
      es: '47 reusable GitHub Actions workflows + 15 starter templates (Java, Krakend, React). GitFlow strategy, quality gates (SonarQube · OWASP · ArchUnit · Qodana), deploys EC2 / EC2-over-WireGuard-VPN / EKS.',
    },
    stack: ['github-actions', 'gitflow', 'sonarqube', 'owasp', 'eks', 'ec2', 'wireguard', 'ecr', 'helm', 'jenkins'],
    links: [],
  },
  {
    slug: 'gsd',
    name: 'GSD framework',
    tag: 'FRAMEWORK',
    desc: {
      en: 'Get-Shit-Done agentic methodology for Claude Code: 37 custom agents, 81 skills, 86 orchestrations and 15 architectural guidelines that drive the discuss → plan → execute → verify cycle.',
      es: 'Metodología agéntica Get-Shit-Done para Claude Code: 37 subagents propios, 81 skills, 86 orquestaciones y 15 guidelines arquitectónicos que conducen el ciclo discuss → plan → execute → verify.',
    },
    stack: ['claude-code', 'subagents', 'skills', 'mcp', 'orchestration', 'tdd', 'hexagonal'],
    links: [],
  },
  {
    slug: 'spring-ai-qdrant-mcp',
    name: 'spring-ai-qdrant-mcp',
    tag: 'MCP',
    desc: {
      en: 'Model Context Protocol server built with Spring Boot 3 + Spring AI + Qdrant vector store. Exposes RAG retrieval over private knowledge bases as MCP tools any Claude-compatible client can call.',
      es: 'Servidor Model Context Protocol construido con Spring Boot 3 + Spring AI + Qdrant vector store. Expone retrieval RAG sobre bases de conocimiento privadas como herramientas MCP que cualquier cliente Claude-compatible puede invocar.',
    },
    stack: ['spring-boot-3', 'spring-ai', 'qdrant', 'mcp', 'rag', 'java-21'],
    links: [],
  },
]

export const COUNTERS = [
  { value: 37, key: 'agents' },
  { value: 81, key: 'skills' },
  { value: 86, key: 'workflows' },
  { value: 15, key: 'guidelines' },
  { value: 47, key: 'ciWorkflows' },
  { value: 15, key: 'starterTemplates' },
  { value: 5, key: 'appsShipped' },
]

export const STACK_CHIPS = [
  'Java 21',
  'Kotlin 2.x',
  'Spring Boot 3',
  'Hexagonal',
  'PostgreSQL',
  'Kafka',
  'Redis',
  'AWS',
  'Docker',
  'Kubernetes',
  'Terraform',
  'GitHub Actions',
  'Jenkins',
  'SonarQube',
  'Claude Code',
  'MCP',
  'Spring AI',
]
