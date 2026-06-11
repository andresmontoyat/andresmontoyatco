// src/data/sections.js
//
// Single source of truth for non-experience sections (Phase 21, Task 21.3).
// Dev view (Phase 21.10) + WorldDetailOverlay (Phase 22) both read from here;
// legacy `src/components/{About,Skills,Projects,Claude,Contact}.js` are
// deleted in Phase 24.
//
// Each section becomes a "world" in the mario-world map (decision Q11-A)
// with its own icon and biome assignment per the plan:
//   about    → pradera   · home
//   skills   → cyber     · mountain
//   projects → selva     · island
//   claude   → castillo  · castle-ai
//   contact  → castillo  · flag
//
// Content shape per section is structured (not HTML strings), so the
// renderer can decide markup. The Claude pitch and About paragraphs still
// embed `<strong>` for inline emphasis — consumers may use
// dangerouslySetInnerHTML for those (mirrors current About.js behavior).
//
// Bilingual contract: every string-bearing field carries `en` and `es`.
// Identical EN/ES values (e.g. project titles like "GUDD API", the email
// address, URLs) are duplicated rather than introducing a "shared" object
// — keeps the consumer-side rendering uniform (`content[lang].x`).
//
// This is a leaf data module: NO React imports, NO runtime side effects.

const SECTIONS = [
  {
    id: 'about',
    biome: 'pradera',
    icon: 'home',
    label: { en: 'About me', es: 'Sobre mí' },
    content: {
      en: {
        heading: 'Who I am',
        paragraphs: [
          "I'm <strong>Carlos Andrés Montoya Tobón</strong>, a Solutions Architect and Senior Backend Engineer based in Medellín, Colombia. For the last 18+ years I've been designing and building Java-based platforms — from transportation management systems and telecom transactional portals to fintech PaaS and blockchain credentials.",
          'My specialty is the <strong>architecture and development of web applications with Spring Framework</strong>, microservices and event-driven systems deployed on AWS, GCP and Azure. I\'ve led distributed teams of up to 45 engineers and helped organizations modernize their stacks and delivery pipelines.',
          "When I'm not coding, I enjoy learning about new tech with my best friends and spending time at home with my wife Viky and our two dogs, Ragnar and Leo.",
        ],
        quickFacts: {
          heading: 'Quick facts',
          rows: [
            { key: 'Location',     value: 'Medellín, CO' },
            { key: 'Current role', value: 'Backend @ Coderio' },
            { key: 'Experience',   value: '18+ years' },
            { key: 'Languages',    value: 'ES · EN' },
            { key: 'Work mode',    value: 'Remote friendly' },
          ],
        },
      },
      es: {
        heading: 'Quién soy',
        paragraphs: [
          'Soy <strong>Carlos Andrés Montoya Tobón</strong>, Arquitecto de Soluciones e Ingeniero Backend Senior radicado en Medellín, Colombia. Llevo más de 18 años diseñando y construyendo plataformas basadas en Java — desde sistemas de gestión de transporte y portales transaccionales de telecomunicaciones hasta PaaS financieros y credenciales blockchain.',
          'Mi especialidad es la <strong>arquitectura y desarrollo de aplicaciones web con Spring Framework</strong>, microservicios y sistemas orientados a eventos desplegados en AWS, GCP y Azure. He liderado equipos distribuidos de hasta 45 ingenieros y ayudado a organizaciones a modernizar sus stacks y pipelines de entrega.',
          'Cuando no estoy programando, disfruto aprendiendo sobre nuevas tecnologías con mis mejores amigos y pasando tiempo en casa con mi esposa Viky y nuestros dos perros, Ragnar y Leo.',
        ],
        quickFacts: {
          heading: 'Datos rápidos',
          rows: [
            { key: 'Ubicación',  value: 'Medellín, CO' },
            { key: 'Rol actual', value: 'Backend @ Coderio' },
            { key: 'Experiencia', value: '+18 años' },
            { key: 'Idiomas',    value: 'ES · EN' },
            { key: 'Modalidad',  value: 'Remoto' },
          ],
        },
      },
    },
  },

  {
    id: 'skills',
    biome: 'cyber',
    icon: 'mountain',
    label: { en: 'Skills', es: 'Habilidades' },
    // Skills are grouped by SKILLS taxonomy category (`src/data/skills.js`).
    // Labels here are the canonical id (same string the user sees as the
    // chip text in the SkillFilters bar). Includes ALL 32 entries — the
    // `featured` flag is NOT filtered here (taxonomy authority stays in
    // skills.js; this section just mirrors labels grouped by category).
    //
    // We duplicate the labels literally instead of importing from skills.js
    // to keep sections.js as a flat, framework-agnostic catalog and avoid
    // coupling content rendering to taxonomy internals. If the SKILLS set
    // changes, update both files (caught by skills.test.js + future
    // sections.test.js).
    content: {
      en: {
        heading: 'Technical stack',
        intro: 'Tools and technologies I use daily to design, build and operate distributed systems.',
        groups: [
          {
            category: 'lang',
            title: 'Languages & Frameworks',
            skills: ['Java', 'Spring Framework', 'Spring Boot', 'React', 'JEE 5'],
          },
          {
            category: 'ai',
            title: 'AI Tooling',
            skills: ['Claude Code', 'GitHub Copilot', 'JetBrains Junie'],
          },
          {
            category: 'arch',
            title: 'Architecture & Integration',
            skills: ['Architecture', 'Microservices', 'Oracle Service Bus', 'WebSphere', 'KrakenD'],
          },
          {
            category: 'cloud',
            title: 'Cloud',
            skills: ['AWS', 'Azure', 'Google Cloud', 'GKE'],
          },
          {
            category: 'devops',
            title: 'DevOps & Infra',
            skills: ['DevOps', 'Kubernetes', 'Docker', 'Jenkins', 'SonarQube', 'Nexus'],
          },
          {
            category: 'security',
            title: 'Security',
            skills: ['Keycloak', 'Spring Security'],
          },
          {
            category: 'data',
            title: 'Data',
            skills: ['SQL', 'Oracle SQL', 'SQL Server', 'MySQL'],
          },
          {
            category: 'hardware',
            title: 'IoT & Hardware',
            skills: ['IoT', 'Asterisk', 'Raspberry Pi'],
          },
        ],
      },
      es: {
        heading: 'Stack técnico',
        intro: 'Herramientas y tecnologías que uso a diario para diseñar, construir y operar sistemas distribuidos.',
        groups: [
          {
            category: 'lang',
            title: 'Lenguajes & Frameworks',
            skills: ['Java', 'Spring Framework', 'Spring Boot', 'React', 'JEE 5'],
          },
          {
            category: 'ai',
            title: 'Herramientas IA',
            skills: ['Claude Code', 'GitHub Copilot', 'JetBrains Junie'],
          },
          {
            category: 'arch',
            title: 'Arquitectura & Integración',
            skills: ['Architecture', 'Microservices', 'Oracle Service Bus', 'WebSphere', 'KrakenD'],
          },
          {
            category: 'cloud',
            title: 'Cloud',
            skills: ['AWS', 'Azure', 'Google Cloud', 'GKE'],
          },
          {
            category: 'devops',
            title: 'DevOps & Infra',
            skills: ['DevOps', 'Kubernetes', 'Docker', 'Jenkins', 'SonarQube', 'Nexus'],
          },
          {
            category: 'security',
            title: 'Seguridad',
            skills: ['Keycloak', 'Spring Security'],
          },
          {
            category: 'data',
            title: 'Datos',
            skills: ['SQL', 'Oracle SQL', 'SQL Server', 'MySQL'],
          },
          {
            category: 'hardware',
            title: 'IoT & Hardware',
            skills: ['IoT', 'Asterisk', 'Raspberry Pi'],
          },
        ],
      },
    },
  },

  {
    id: 'projects',
    biome: 'selva',
    icon: 'island',
    label: { en: 'Projects', es: 'Proyectos' },
    // Items mirror `src/data/projects.js` order. `link` is the live URL when
    // present, else the GitHub URL — current data has both as null, so the
    // field is null for all entries (consumer hides CTA when null).
    content: {
      en: {
        heading: 'Selected work',
        intro: 'A focused look at the systems I have shipped recently.',
        items: [
          {
            title: 'Person API',
            description: 'High-performance user-profile domain service at Coderio. Led a 40% latency reduction through query optimization, caching and hexagonal architecture refactoring.',
            link: null,
            tech: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Hexagonal Architecture', 'Testcontainers'],
          },
          {
            title: 'GUDD API',
            description: 'Event-driven audit and compliance service at Coderio. Enhanced event auditing pipelines for stronger observability and regulatory compliance across the user-profile squad.',
            link: null,
            tech: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'AWS'],
          },
          {
            title: 'Blockchain Credentials Platform',
            description: 'Digital credentials verification platform at Blerify. Issued and validated verifiable credentials on Ethereum, secured with Keycloak and routed through KrakenD on Kubernetes.',
            link: null,
            tech: ['Kotlin', 'Spring Boot', 'Ethereum', 'Keycloak', 'KrakenD', 'Kubernetes', 'GKE'],
          },
          {
            title: 'AI-Driven Coding Workflows',
            description: 'GSD methodology and structured AI coding workflows integrating Claude Code, GitHub Copilot and JetBrains Junie with TDD and hexagonal architecture to accelerate backend delivery.',
            link: null,
            tech: ['Claude Code', 'GitHub Copilot', 'TDD', 'Hexagonal Architecture', 'Spring Boot'],
          },
        ],
      },
      es: {
        heading: 'Trabajo destacado',
        intro: 'Una mirada enfocada a los sistemas que he entregado recientemente.',
        items: [
          {
            title: 'Person API',
            description: 'Servicio de dominio de perfil de usuario de alto rendimiento en Coderio. Lideré una reducción de latencia del 40% mediante optimización de consultas, caché y refactorización con arquitectura hexagonal.',
            link: null,
            tech: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Hexagonal Architecture', 'Testcontainers'],
          },
          {
            title: 'GUDD API',
            description: 'Servicio de auditoría y cumplimiento orientado a eventos en Coderio. Mejoré los pipelines de auditoría para mayor observabilidad y cumplimiento regulatorio en el squad de perfil de usuario.',
            link: null,
            tech: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'AWS'],
          },
          {
            title: 'Plataforma de Credenciales Blockchain',
            description: 'Plataforma de verificación de credenciales digitales en Blerify. Emití y validé credenciales verificables en Ethereum, aseguradas con Keycloak y enrutadas por KrakenD sobre Kubernetes.',
            link: null,
            tech: ['Kotlin', 'Spring Boot', 'Ethereum', 'Keycloak', 'KrakenD', 'Kubernetes', 'GKE'],
          },
          {
            title: 'Flujos de Desarrollo con IA',
            description: 'Metodología GSD y flujos de codificación estructurados con IA integrando Claude Code, GitHub Copilot y JetBrains Junie con TDD y arquitectura hexagonal para acelerar la entrega backend.',
            link: null,
            tech: ['Claude Code', 'GitHub Copilot', 'TDD', 'Hexagonal Architecture', 'Spring Boot'],
          },
        ],
      },
    },
  },

  {
    id: 'claude',
    biome: 'castillo',
    icon: 'castle-ai',
    label: { en: 'Claude Code', es: 'Claude Code' },
    // Mirrors `src/data/claude.js` (VALUES + SERVICES + APPS + COUNTERS +
    // STACK_CHIPS) merged with translations.js claude block. Each list
    // carries pre-resolved bilingual labels so the consumer needs no t.*
    // lookup. `proof.counters` keeps the original {value, label} shape.
    content: {
      en: {
        eyebrow: 'AI Engineering · For your team',
        headingPart1: 'Backend systems',
        headingPart2: 'delivered with AI discipline',
        pitch: 'Senior backend engineer. Combining hexagonal architecture, Spring Boot, and agentic workflows with Claude Code to ship production-ready features in a fraction of the time — without sacrificing testing, ADRs, or observability.',
        ctaPrimary: "Let's talk about your project →",
        ctaSecondary: 'See projects',
        values: [
          {
            id: '01',
            key: 'velocity',
            title: 'Delivery 3–5× faster',
            description: 'Agentic workflows (discuss → plan → execute → verify) ship in hours what takes days traditionally, while preserving atomic commits and real tests.',
          },
          {
            id: '02',
            key: 'discipline',
            title: 'Hexagonal without shortcuts',
            description: 'Hexagonal architecture, ports & adapters, ArchUnit gates and ADRs are non-negotiable — agentic speed never comes at the cost of structure.',
          },
          {
            id: '03',
            key: 'quality',
            title: 'Tests + observability built-in',
            description: 'Tests (JUnit, Karate, Testcontainers), structured logging and OpenTelemetry tracing are wired from day one, not bolted on later.',
          },
          {
            id: '04',
            key: 'transfer',
            title: 'Your team keeps the workflow',
            description: "I leave your team the workflow, not a black box: the agents, skills and guidelines stay in your repo and your engineers keep using them after I'm gone.",
          },
        ],
        proof: {
          eyebrow: 'Track record',
          heading: 'I built my own toolkit before selling it',
          counters: [
            { key: 'agents',           value: 37, label: 'custom agents' },
            { key: 'skills',           value: 81, label: 'workflow skills' },
            { key: 'workflows',        value: 86, label: 'orchestrations' },
            { key: 'guidelines',       value: 15, label: 'guidelines' },
            { key: 'ciWorkflows',      value: 47, label: 'CI workflows' },
            { key: 'starterTemplates', value: 15, label: 'starter templates' },
            { key: 'appsShipped',      value: 5,  label: 'apps shipped' },
          ],
        },
        servicesLabel: 'Concrete services',
        services: [
          {
            key: 'greenfield',
            title: 'Greenfield builds',
            description: 'Spring Boot + hexagonal from scratch with CI/CD, observability and complete testing infra.',
          },
          {
            key: 'aiSetup',
            title: 'AI workflow setup',
            description: 'Custom agents, skills and slash-commands tailored to your codebase so your team adopts the workflow on day one.',
          },
          {
            key: 'mcp',
            title: 'MCP server development',
            description: 'Model Context Protocol servers in Java/Kotlin with Spring AI that connect Claude to your internal systems.',
          },
          {
            key: 'legacy',
            title: 'Legacy refactor',
            description: 'Strangler-fig refactor of legacy Spring/Java services toward hexagonal architecture, with full test coverage and zero downtime.',
          },
          {
            key: 'devops',
            title: 'DevOps automation',
            description: 'Production-ready GitHub Actions templates + GitFlow + multi-cloud deploys (EC2, VPN-tunneled EC2, EKS) backed by the soldife/ci-templates toolkit.',
          },
        ],
        featuredApps: [
          {
            slug: 'ci-templates',
            name: 'ci-templates',
            tag: 'OPEN SOURCE',
            description: '47 reusable GitHub Actions workflows + 15 starter templates (Java, Krakend, React). GitFlow strategy, quality gates (SonarQube · OWASP · ArchUnit · Qodana), deploys EC2 / EC2-over-WireGuard-VPN / EKS.',
            stack: ['github-actions', 'gitflow', 'sonarqube', 'owasp', 'eks', 'ec2', 'wireguard', 'ecr', 'helm', 'jenkins'],
          },
          {
            slug: 'gsd',
            name: 'GSD framework',
            tag: 'FRAMEWORK',
            description: 'Get-Shit-Done agentic methodology for Claude Code: 37 custom agents, 81 skills, 86 orchestrations and 15 architectural guidelines that drive the discuss → plan → execute → verify cycle.',
            stack: ['claude-code', 'subagents', 'skills', 'mcp', 'orchestration', 'tdd', 'hexagonal'],
          },
          {
            slug: 'spring-ai-qdrant-mcp',
            name: 'spring-ai-qdrant-mcp',
            tag: 'MCP',
            description: 'Model Context Protocol server built with Spring Boot 3 + Spring AI + Qdrant vector store. Exposes RAG retrieval over private knowledge bases as MCP tools any Claude-compatible client can call.',
            stack: ['spring-boot-3', 'spring-ai', 'qdrant', 'mcp', 'rag', 'java-21'],
          },
        ],
        stack: [
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
        ],
      },
      es: {
        eyebrow: 'AI Engineering · Para tu equipo',
        headingPart1: 'Sistemas backend',
        headingPart2: 'entregados con disciplina AI',
        pitch: 'Senior backend engineer. Combino hexagonal architecture, Spring Boot y workflows agénticos con Claude Code para entregar features production-ready en una fracción del tiempo — sin sacrificar testing, ADRs ni observability.',
        ctaPrimary: 'Hablemos de tu proyecto →',
        ctaSecondary: 'Ver proyectos',
        values: [
          {
            id: '01',
            key: 'velocity',
            title: 'Entrega 3–5× más rápida',
            description: 'Workflows agénticos (discuss → plan → execute → verify) entregan en horas lo que toma días con desarrollo tradicional, manteniendo atomic commits y tests reales.',
          },
          {
            id: '02',
            key: 'discipline',
            title: 'Hexagonal sin atajos',
            description: 'Hexagonal architecture, ports & adapters, ArchUnit gates y ADRs no se negocian — la velocidad agéntica nunca sacrifica estructura.',
          },
          {
            id: '03',
            key: 'quality',
            title: 'Tests + observability built-in',
            description: 'Tests (JUnit, Karate, Testcontainers), structured logging y tracing con OpenTelemetry quedan cableados desde el día uno, no parchados después.',
          },
          {
            id: '04',
            key: 'transfer',
            title: 'Tu equipo se lleva el workflow',
            description: 'Le dejo a tu equipo el workflow, no una caja negra: los agents, skills y guidelines quedan en tu repo y tus ingenieros los siguen usando cuando yo no esté.',
          },
        ],
        proof: {
          eyebrow: 'Track record',
          heading: 'Construí mi propio toolkit antes de venderlo',
          counters: [
            { key: 'agents',           value: 37, label: 'subagents propios' },
            { key: 'skills',           value: 81, label: 'workflow skills' },
            { key: 'workflows',        value: 86, label: 'orquestaciones' },
            { key: 'guidelines',       value: 15, label: 'guidelines' },
            { key: 'ciWorkflows',      value: 47, label: 'CI workflows' },
            { key: 'starterTemplates', value: 15, label: 'starter templates' },
            { key: 'appsShipped',      value: 5,  label: 'apps shipped' },
          ],
        },
        servicesLabel: 'Servicios concretos',
        services: [
          {
            key: 'greenfield',
            title: 'Greenfield builds',
            description: 'Spring Boot + hexagonal desde cero, con CI/CD, observability y testing infra completas.',
          },
          {
            key: 'aiSetup',
            title: 'AI workflow setup',
            description: 'Subagents, skills y slash-commands a medida de tu codebase para que tu equipo adopte el workflow desde el primer día.',
          },
          {
            key: 'mcp',
            title: 'MCP server development',
            description: 'Servidores Model Context Protocol en Java/Kotlin con Spring AI que conectan Claude a tus sistemas internos.',
          },
          {
            key: 'legacy',
            title: 'Legacy refactor',
            description: 'Refactor strangler-fig de servicios Spring/Java legacy hacia hexagonal architecture, con cobertura completa de tests y cero downtime.',
          },
          {
            key: 'devops',
            title: 'DevOps automation',
            description: 'Templates de GitHub Actions listos para producción + GitFlow + deploys multi-cloud (EC2, EC2 sobre VPN, EKS) respaldados por el toolkit soldife/ci-templates.',
          },
        ],
        featuredApps: [
          {
            slug: 'ci-templates',
            name: 'ci-templates',
            tag: 'CÓDIGO ABIERTO',
            description: '47 reusable GitHub Actions workflows + 15 starter templates (Java, Krakend, React). GitFlow strategy, quality gates (SonarQube · OWASP · ArchUnit · Qodana), deploys EC2 / EC2-over-WireGuard-VPN / EKS.',
            stack: ['github-actions', 'gitflow', 'sonarqube', 'owasp', 'eks', 'ec2', 'wireguard', 'ecr', 'helm', 'jenkins'],
          },
          {
            slug: 'gsd',
            name: 'framework GSD',
            tag: 'FRAMEWORK',
            description: 'Metodología agéntica Get-Shit-Done para Claude Code: 37 subagents propios, 81 skills, 86 orquestaciones y 15 guidelines arquitectónicos que conducen el ciclo discuss → plan → execute → verify.',
            stack: ['claude-code', 'subagents', 'skills', 'mcp', 'orchestration', 'tdd', 'hexagonal'],
          },
          {
            slug: 'spring-ai-qdrant-mcp',
            name: 'spring-ai-qdrant-mcp',
            tag: 'MCP',
            description: 'Servidor Model Context Protocol construido con Spring Boot 3 + Spring AI + Qdrant vector store. Expone retrieval RAG sobre bases de conocimiento privadas como herramientas MCP que cualquier cliente Claude-compatible puede invocar.',
            stack: ['spring-boot-3', 'spring-ai', 'qdrant', 'mcp', 'rag', 'java-21'],
          },
        ],
        stack: [
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
        ],
      },
    },
  },

  {
    id: 'contact',
    biome: 'castillo',
    icon: 'flag',
    label: { en: 'Contact', es: 'Contacto' },
    // Email is the same in both languages but duplicated for uniform
    // consumer access. `social` mirrors Contact.js + Footer.js entries.
    // `cv` points to the static CV docx files served from /public.
    content: {
      en: {
        heading: "Let's build something",
        intro: 'Open to senior backend, architecture and technical leadership roles. Feel free to reach out.',
        email: 'andresmontoyat@gmail.com',
        emailLabel: 'Email',
        phone: '+57 324 442 2196',
        phoneLabel: 'Phone',
        social: [
          {
            label: 'LinkedIn',
            url: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033',
            handle: 'carlos-andres-montoya-tobon',
            icon: 'in',
          },
          {
            label: 'GitHub',
            url: 'https://github.com/andresmontoyat',
            handle: 'andresmontoyat',
            icon: 'gh',
          },
        ],
        cv: {
          url: '/CV_Carlos_Montoya_EN.docx',
          label: 'Download CV (English)',
        },
      },
      es: {
        heading: 'Construyamos algo juntos',
        intro: 'Abierto a roles senior de backend, arquitectura y liderazgo técnico. Escríbeme sin pena.',
        email: 'andresmontoyat@gmail.com',
        emailLabel: 'Correo',
        phone: '+57 324 442 2196',
        phoneLabel: 'Teléfono',
        social: [
          {
            label: 'LinkedIn',
            url: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033',
            handle: 'carlos-andres-montoya-tobon',
            icon: 'in',
          },
          {
            label: 'GitHub',
            url: 'https://github.com/andresmontoyat',
            handle: 'andresmontoyat',
            icon: 'gh',
          },
        ],
        cv: {
          url: '/CV_Carlos_Montoya_ES.docx',
          label: 'Descargar CV (Español)',
        },
      },
    },
  },
]

export { SECTIONS }
export default SECTIONS
