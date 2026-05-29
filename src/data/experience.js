const EXPERIENCE = [
  {
    date: { en: 'Jan 2026 — Present', es: 'Ene 2026 — Presente' },
    title: { en: 'Backend Developer — Squad User Profile', es: 'Backend Developer — Squad User Profile' },
    company: 'Coderio',
    location: { en: 'Remote', es: 'Remoto' },
    bullets: {
      en: [
        'Leading performance improvements on the Person API (estimated 40% latency reduction).',
        'Enhancing event auditing in the GUDD API for stronger compliance and observability.',
        'Working in a cross-functional squad on user-profile domain services (Java · Spring Boot).',
        'Accelerating daily development with AI coding assistants (Claude Code, GitHub Copilot, JetBrains Junie).',
      ],
      es: [
        'Lidero mejoras de rendimiento en la Person API (reducción estimada del 40% en latencia).',
        'Mejoro la auditoría de eventos de la GUDD API para un cumplimiento y observabilidad más sólidos.',
        'Trabajo en un squad multifuncional sobre servicios del dominio de perfil de usuario (Java · Spring Boot).',
        'Acelero el desarrollo diario con asistentes de IA (Claude Code, GitHub Copilot, JetBrains Junie).',
      ],
    },
    tech: ['Java', 'Spring Boot', 'Claude Code', 'GitHub Copilot', 'JetBrains Junie'],
    period: { start: 2026, end: null },
    featured: true,
  },
  {
    date: { en: 'Sep 2024 — Dec 2025', es: 'Sep 2024 — Dic 2025' },
    title: { en: 'Backend Developer', es: 'Backend Developer' },
    company: 'F2X SAS',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Delivered new product features and core platform capabilities.',
        'Drove architecture improvements and cross-team collaboration.',
        'Supported production operations and incident response.',
      ],
      es: [
        'Entregué nuevas funcionalidades y capacidades core de la plataforma.',
        'Impulsé mejoras de arquitectura y colaboración entre equipos.',
        'Apoyé operaciones en producción y respuesta a incidentes.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'Microservices'],
    period: { start: 2024, end: 2025 },
    featured: true,
  },
  {
    date: { en: 'Jan 2024 — Jan 2025', es: 'Ene 2024 — Ene 2025' },
    title: { en: 'Backend Developer', es: 'Backend Developer' },
    company: 'Blerify',
    location: { en: 'Delaware, USA (Remote)', es: 'Delaware, EE.UU. (Remoto)' },
    bullets: {
      en: [
        'Built a blockchain platform for digital credentials verification.',
        'Implemented Keycloak security and KrakenD API Gateway on Kubernetes.',
        'Administered GKE clusters on Google Cloud.',
      ],
      es: [
        'Construí una plataforma blockchain para verificación de credenciales digitales.',
        'Implementé seguridad con Keycloak y el API Gateway KrakenD sobre Kubernetes.',
        'Administré clústeres GKE en Google Cloud.',
      ],
    },
    tech: ['Java', 'Keycloak', 'KrakenD', 'Kubernetes', 'GKE', 'Google Cloud'],
    period: { start: 2024, end: 2025 },
    featured: true,
  },
  {
    date: { en: 'Aug 2020 — Feb 2022', es: 'Ago 2020 — Feb 2022' },
    title: { en: 'Solutions Architect', es: 'Arquitecto de Soluciones' },
    company: 'KLEVER SAS',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Architected PaaS solutions for next-gen banking products on AWS.',
        'Designed reusable security and Keycloak/GCP integration frameworks.',
        'Mentored developers on Spring, SOLID and clean architecture.',
      ],
      es: [
        'Diseñé soluciones PaaS para productos bancarios de próxima generación en AWS.',
        'Diseñé frameworks reutilizables de seguridad e integraciones con Keycloak/GCP.',
        'Mentoricé desarrolladores en Spring, SOLID y arquitectura limpia.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'AWS', 'Keycloak', 'GCP'],
    period: { start: 2020, end: 2022 },
    featured: true,
  },
  {
    date: { en: 'Aug 2013 — Sep 2015', es: 'Ago 2013 — Sep 2015' },
    title: { en: 'Technical Lead & Solutions Architect LATAM', es: 'Líder Técnico & Arquitecto de Soluciones LATAM' },
    company: 'Tata Consultancy Services',
    location: { en: 'LATAM', es: 'LATAM' },
    bullets: {
      en: [
        'Led a team of 45+ developers delivering the Claro Perú transactional portal.',
        'Designed the Oracle Service Bus integration layer for Claro Colombia.',
        'Built WebSphere Portlet components and CI infrastructure.',
      ],
      es: [
        'Lideré un equipo de más de 45 desarrolladores entregando el portal transaccional de Claro Perú.',
        'Diseñé la capa de integración sobre Oracle Service Bus para Claro Colombia.',
        'Construí componentes WebSphere Portlets e infraestructura de CI.',
      ],
    },
    tech: ['Java', 'Oracle Service Bus', 'WebSphere', 'Jenkins'],
    period: { start: 2013, end: 2015 },
    featured: true,
  },
  {
    date: { en: 'Aug 2023 — Mar 2024', es: 'Ago 2023 — Mar 2024' },
    title: { en: 'Backend Developer', es: 'Backend Developer' },
    company: 'SM TECH SAS',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'DraiverDO app components and microservices integrations.',
        'Led code reviews and bug resolution across the backend team.',
      ],
      es: [
        'Componentes para la app DraiverDO e integraciones de microservicios.',
        'Lideré revisiones de código y resolución de bugs en el equipo backend.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'Microservices'],
    period: { start: 2023, end: 2024 },
  },
  {
    date: { en: 'Apr 2022 — Jun 2023', es: 'Abr 2022 — Jun 2023' },
    title: { en: 'Backend Developer', es: 'Backend Developer' },
    company: 'TUL SAS',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Security components for the TUL B2B marketplace microservices.',
        'Resource management modules and platform code-quality reviews.',
      ],
      es: [
        'Componentes de seguridad para los microservicios del marketplace B2B de TUL.',
        'Módulos de gestión de recursos y revisiones de calidad de código.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'Spring Security', 'Microservices'],
    period: { start: 2022, end: 2023 },
  },
  {
    date: { en: 'May 2021 — Feb 2022', es: 'May 2021 — Feb 2022' },
    title: { en: 'Backend & DevOps Engineer', es: 'Backend & Ingeniero DevOps' },
    company: 'Linked',
    location: { en: 'Remote', es: 'Remoto' },
    bullets: {
      en: [
        'Brought 15+ microservices into continuous integration and deployment.',
        'Installed and configured Jenkins, SonarQube, Nexus and Docker.',
      ],
      es: [
        'Integré más de 15 microservicios a integración y despliegue continuos.',
        'Instalé y configuré Jenkins, SonarQube, Nexus y Docker.',
      ],
    },
    tech: ['Jenkins', 'SonarQube', 'Nexus', 'Docker', 'Microservices'],
    period: { start: 2021, end: 2022 },
  },
  {
    date: { en: 'Nov 2009 — Jan 2021', es: 'Nov 2009 — Ene 2021' },
    title: { en: 'Solutions Architect & DevOps Engineer', es: 'Arquitecto de Soluciones & Ingeniero DevOps' },
    company: 'PATH — INNKUA',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'NetPlanet data-analysis components for the Claro network.',
        'Vehicle tracking, IoT pilots for the City of Medellín and AWS/on-prem infra.',
      ],
      es: [
        'Componentes de análisis de datos NetPlanet para la red de Claro.',
        'Rastreo vehicular, pilotos IoT para Medellín e infraestructura AWS/On-Premise.',
      ],
    },
    tech: ['Java', 'AWS', 'IoT', 'Spring Boot'],
    period: { start: 2009, end: 2021 },
  },
  {
    date: { en: 'Jun 2012 — Aug 2013', es: 'Jun 2012 — Ago 2013' },
    title: { en: 'Technical Lead & Solutions Architect', es: 'Líder Técnico & Arquitecto de Soluciones' },
    company: 'Grupo Nethexa',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Predictive call systems integrating Java with Asterisk telephony.',
        'Mail Bomber, SMS delivery and Raspberry Pi digital-signage systems.',
      ],
      es: [
        'Sistemas de llamadas predictivas integrando Java con telefonía Asterisk.',
        'Sistemas Mail Bomber, de envío de SMS y señalización digital con Raspberry Pi.',
      ],
    },
    tech: ['Java', 'Asterisk', 'Raspberry Pi'],
    period: { start: 2012, end: 2013 },
  },
  {
    date: { en: 'Jun 2009 — Jun 2010', es: 'Jun 2009 — Jun 2010' },
    title: { en: 'Senior Developer', es: 'Desarrollador Senior' },
    company: 'Ceiba Software House',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Loan, policy and occupational-risk systems in Java 7 / JEE 5.',
        'Oracle SQL procedures and efficient backend components.',
      ],
      es: [
        'Sistemas de préstamos, pólizas y riesgos laborales en Java 7 / JEE 5.',
        'Procedimientos SQL en Oracle y componentes backend eficientes.',
      ],
    },
    tech: ['Java', 'JEE 5', 'Oracle SQL'],
    period: { start: 2009, end: 2010 },
  },
  {
    date: { en: 'Apr 2007 — Jun 2009', es: 'Abr 2007 — Jun 2009' },
    title: { en: 'Senior Developer', es: 'Desarrollador Senior' },
    company: 'Mercurio SAS (Castor SAS)',
    location: { en: 'Medellín, Colombia', es: 'Medellín, Colombia' },
    bullets: {
      en: [
        'Transportation Management System serving 25+ companies.',
        'Accounting integrations in Java JDK 1.4–8 with SQL Server and MySQL.',
      ],
      es: [
        'Sistema de Gestión de Transporte (TMS) usado por más de 25 empresas.',
        'Integraciones contables en Java JDK 1.4–8 con SQL Server y MySQL.',
      ],
    },
    tech: ['Java', 'SQL Server', 'MySQL'],
    period: { start: 2007, end: 2009 },
  },
]

export default EXPERIENCE
