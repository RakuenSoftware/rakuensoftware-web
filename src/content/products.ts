export interface ProductFeature {
  icon: string;
  title: string;
  body: string;
}

export interface ProductSection {
  title: string;
  body: string[];
  bullets?: string[];
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  /** One-paragraph summary used on the home page card and the hero. */
  summary: string;
  /** Public repository URL. Omitted for products that are not public yet. */
  repo?: string;
  /** Shown as a badge, e.g. "Private beta". Omitted when generally available. */
  status?: string;
  features: ProductFeature[];
  sections: ProductSection[];
}

export const PRODUCTS: Product[] = [
  {
    slug: 'smoothnas',
    name: 'SmoothNAS',
    tagline: 'A Linux storage appliance that does not hide the Linux',
    summary:
      'SmoothNAS gives you the power of the Linux storage stack without stitching it together by hand. Install it on commodity hardware, manage it from a browser, and keep the tools underneath it.',
    repo: 'https://github.com/RakuenSoftware/smoothnas',
    features: [
      { icon: '🧱', title: 'Real Linux storage', body: 'mdadm for RAID, LVM for named tier backing, and ZFS for pool-based storage — the actual tools, not a reimplementation.' },
      { icon: '🌡️', title: 'Tiered by default', body: 'smoothfs presents tiered storage as a single mount and drives file placement across tiers automatically.' },
      { icon: '🔌', title: 'Plugin system', body: 'Run co-located apps in managed containers, from GitHub runners to llama.cpp and vLLM inference.' },
      { icon: '💽', title: 'Its own installer', body: 'A custom Debian installer and a web UI that drives the whole system, built on SmoothISO and SmoothGUI.' },
      { icon: '📊', title: 'Operations included', body: 'SMART monitoring, benchmarking, networking and sharing controls, and scheduled backups.' },
      { icon: '🤖', title: 'Agent-ready', body: 'Repo-local aimee MCP support, so engineering agents can work against the appliance directly.' },
    ],
    sections: [
      {
        title: 'The problem it solves',
        body: [
          'Most Linux storage stacks force a choice: assemble mdadm, LVM, ZFS, SMART tooling and sharing by hand and own the complexity forever, or adopt an appliance that hides the Linux underneath and boxes you in when you need something it did not anticipate.',
          'SmoothNAS refuses that trade. The appliance drives standard Linux tools, and those tools stay reachable.',
        ],
      },
      {
        title: 'What it combines',
        body: ['A single appliance covering the whole storage lifecycle:'],
        bullets: [
          'mdadm for RAID and nonraid for Unraid-style parity arrays',
          'LVM for named tier backing and ZFS for pool-based storage',
          'smoothfs for automatic placement of files across tiers',
          'SMART, benchmarking, networking and sharing controls',
          'Scheduled backups and a container plugin system',
        ],
      },
    ],
  },
  {
    slug: 'smoothfs',
    name: 'SmoothFS',
    tagline: 'Hot data on fast disks, cold data on cheap ones, one mount point',
    summary:
      'smoothfs is the stacked kernel filesystem behind SmoothNAS tiering. It keeps fast and slow storage together under one mount and moves files between tiers automatically.',
    repo: 'https://github.com/RakuenSoftware/smoothfs',
    features: [
      { icon: '⚡', title: 'Automatic placement', body: 'Hot data lands on SSD and NVMe, cold data moves to slower media, without applications knowing.' },
      { icon: '🔗', title: 'Protocol transparent', body: 'NFS, SMB and iSCSI behave exactly as before while placement is optimised underneath.' },
      { icon: '💷', title: 'Cost without compromise', body: 'Buy capacity on cheap media and performance on fast media, instead of paying for one tier everywhere.' },
      { icon: '🛟', title: 'Explicit recovery', body: 'Movement uses explicit state transitions with defined recovery paths, including active-LUN movement.' },
    ],
    sections: [
      {
        title: 'Why tiering belongs in the filesystem',
        body: [
          'Caching layers guess. A tiering filesystem decides, and can be reasoned about: every file has a tier, every movement is a state transition, and every transition has a recovery path.',
          'For operators that means better performance where it matters, simpler growth on mixed hardware, and predictable operations because the movement and recovery flows are explicit rather than emergent.',
        ],
      },
    ],
  },
  {
    slug: 'smoothrouter',
    name: 'SmoothRouter',
    tagline: 'A Debian router with the full Linux networking stack and a browser UI',
    summary:
      'SmoothRouter replaces the usual choice between locked-down consumer firmware and a BSD-based appliance. It is Debian, running the Linux networking stack, administered from a web UI.',
    status: 'Private beta',
    features: [
      { icon: '🛡️', title: 'nftables firewall and NAT', body: 'The modern Linux packet filter drives firewalling and NAT — not a legacy iptables shim.' },
      { icon: '🌐', title: 'DNS and DHCP', body: 'dnsmasq provides the resolver and DHCP service, managed and applied from the UI.' },
      { icon: '🔗', title: 'PPPoE WAN', body: 'First-class PPPoE support for DSL and fibre lines that require a session rather than plain DHCP.' },
      { icon: '🚫', title: 'DNS blocklists', body: 'Network-wide blocking applied at the resolver, so every device is covered without per-device software.' },
      { icon: '📈', title: 'Monitoring and health', body: 'Built-in monitoring and health checks report what the router is actually doing.' },
      { icon: '🔄', title: 'Managed updates', body: 'An updater service keeps the appliance current without hand-driven package surgery.' },
    ],
    sections: [
      {
        title: 'Who it is for',
        body: [
          'SmoothRouter targets homelab, small office and prosumer networks — people who want real Debian packages and the Linux networking stack rather than a frozen port tree, and who would still rather not hand-write configuration files.',
          'It is not trying to beat consumer routers on hardware price. It is trying to be the router you can actually administer, on hardware you chose.',
        ],
      },
      {
        title: 'Shared foundations',
        body: [
          'SmoothRouter runs the same kernel as SmoothNAS via SmoothKernel, so driver coverage, firmware baseline and hardware tooling carry across both products. Its web UI is a React application built on SmoothGUI, the same component library used by every other Rakuen Software appliance.',
        ],
      },
      {
        title: 'Safe by default on first boot',
        body: [
          'A router’s admin UI must never appear on the WAN. On first boot SmoothRouter brings up no interfaces beyond loopback and leaves the management daemon stopped. A console-driven setup wizard identifies the interfaces and decides which is WAN and which is LAN before anything starts listening.',
        ],
      },
    ],
  },
  {
    slug: 'nonraid',
    name: 'nonraid',
    tagline: 'Unraid-style parity arrays, as a standalone implementation',
    summary:
      'nonraid models the Unraid-style storage layout: every data disk keeps its own filesystem, and one to three parity disks protect them all. Mixed disk sizes are fine.',
    repo: 'https://github.com/RakuenSoftware/nonraid',
    features: [
      { icon: '🧩', title: 'Independent disks', body: 'Each data disk owns an individual filesystem, so losing more disks than parity covers never costs you the whole array.' },
      { icon: '🛡️', title: 'Up to three parity disks', body: 'Choose the protection level you need. No data disk may exceed the smallest parity disk.' },
      { icon: '📐', title: 'Mixed sizes welcome', body: 'Add the disks you actually have. Data disks do not need to match each other.' },
      { icon: '⚙️', title: 'Portable core', body: 'A portable layout validator, parity engine and Galois-field maths, with a Linux NBD transport.' },
    ],
    sections: [
      {
        title: 'A clean split of responsibilities',
        body: [
          'nonraid deliberately stops at the storage layout. It ships the layout validator, the parity engine, the Galois-field arithmetic and the NBD transport — the parts worth getting provably right.',
          'SmoothNAS owns everything appliance-specific on top: the control plane, the database rows, the API handlers and mount orchestration. That split keeps the parity engine testable in isolation and useful outside the appliance.',
        ],
      },
    ],
  },
  {
    slug: 'aimee',
    name: 'aimee',
    tagline: 'Persistent memory and guardrails for any AI coding tool',
    summary:
      'aimee is a local server that gives AI coding tools a persistent memory, a map of your code, cheap delegate models, and guardrails they cannot write past. Your context follows you between tools.',
    repo: 'https://github.com/RakuenSoftware/aimee',
    features: [
      { icon: '🧠', title: 'Memory across sessions', body: 'A curator distills each session into a typed knowledge base, dedupes facts, flags contradictions and lets stale detail decay.' },
      { icon: '🕸️', title: 'Your code as a graph', body: 'aimee indexes code into a symbol and call graph spanning repositories, so tools can trace an edit’s blast radius before writing.' },
      { icon: '🤝', title: 'Shared team memory', body: 'Point a team at one knowledge base and everyone works from the same memory instead of re-explaining the project.' },
      { icon: '🚦', title: 'Guardrails', body: 'Policy the model cannot talk its way around, enforced by the server rather than requested in a prompt.' },
      { icon: '💸', title: 'Cheap delegates', body: 'Route bounded sub-tasks to smaller models, keeping the expensive model for work that needs it.' },
      { icon: '🔧', title: 'Tool agnostic', body: 'Point your existing tool at it or run it alongside. It is not tied to one editor or one vendor.' },
    ],
    sections: [
      {
        title: 'Two parts',
        body: ['aimee splits into a personal assistant and a shared corpus:'],
        bullets: [
          'aimee-server — an assistant to one human. It learns how you work and what you expect. General purpose, but strongest across large or multi-repo codebases.',
          'aimee-kb — a knowledge base for a whole corpus: a subject, a company, or a team.',
        ],
      },
      {
        title: 'Why it exists',
        body: [
          'AI coding tools forget everything between sessions, and re-derive the same understanding of your codebase every time. Worse, they will happily act outside the lines when nothing enforces the lines.',
          'aimee makes memory durable, makes code structure queryable instead of guessed, and puts enforcement where a model cannot argue with it.',
        ],
      },
    ],
  },
  {
    slug: 'smoothgui',
    name: 'SmoothGUI',
    tagline: 'The shared component library behind every Rakuen Software interface',
    summary:
      'SmoothGUI is the React component library every Rakuen Software product builds on — appliance consoles, installers, and this website. One look, one set of behaviours, one place to fix them.',
    repo: 'https://github.com/RakuenSoftware/smoothgui',
    features: [
      { icon: '🎛️', title: 'Console primitives', body: 'AppShell, Panel, DataTable, Wizard, Drawer, Toast and the rest of the appliance-administration vocabulary.' },
      { icon: '📄', title: 'Content primitives', body: 'SiteHeader, Hero, Section, FeatureGrid, Prose, ArticleCard and CodeBlock for public and long-form pages.' },
      { icon: '🎨', title: 'Design tokens', body: 'A single token set exported as both CSS custom properties and typed JavaScript values.' },
      { icon: '🌍', title: 'Internationalised', body: 'A built-in i18n context with English and Dutch catalogues, extensible per product.' },
      { icon: '💽', title: 'Installer frontend', body: 'A dedicated installer build, consumed by SmoothISO to render product installers.' },
      { icon: '🔒', title: 'Auth built in', body: 'Login, forced password change and an auth context, so products do not reinvent the session flow.' },
    ],
    sections: [
      {
        title: 'One library, two halves',
        body: [
          'SmoothGUI began as the console vocabulary for SmoothNAS. It is deliberately general: the same library ships the appliance console, the installer that runs before the appliance exists, and the marketing site you are reading now.',
          'That constraint keeps it honest. A component that only works inside a sidebar layout does not belong in a shared library.',
        ],
      },
    ],
  },
  {
    slug: 'smoothiso-smoothkernel',
    name: 'SmoothISO & SmoothKernel',
    tagline: 'The installer and the kernel every Smooth* product is built from',
    summary:
      'SmoothISO builds Debian-based installer ISOs for any product. SmoothKernel builds the one kernel line they all install. Together they are the foundation the appliances stand on.',
    repo: 'https://github.com/RakuenSoftware/smoothiso',
    features: [
      { icon: '💿', title: 'Product-agnostic ISOs', body: 'SmoothISO is generic. Products supply a name, a version and a hooks directory; the builder does the rest.' },
      { icon: '🪝', title: 'Hook-driven', body: 'Product-specific behaviour is injected through packages and configure hooks, not by forking the builder.' },
      { icon: '🖥️', title: 'A real installer UI', body: 'The installer frontend is a SmoothGUI build, so installation looks like the appliance it is about to install.' },
      { icon: '🐧', title: 'One kernel line', body: 'SmoothKernel builds a current, low-latency, hardware-friendly kernel as Debian packages for the whole family.' },
      { icon: '🧬', title: 'Visible patches', body: 'A pristine kernel.org base plus vendored patch lanes, so every downstream change is visible in git.' },
      { icon: '🏗️', title: 'Per-architecture configs', body: 'Canonical configs and one ordered patch stack, built once and installed by every flavour.' },
    ],
    sections: [
      {
        title: 'Why they are shared',
        body: [
          'SmoothNAS, SmoothRouter and the desktop and HTPC flavours all need an installer and a kernel. Maintaining four installer pipelines and four kernel pipelines would guarantee they drift apart.',
          'Instead there is one of each. Flavour differences stay in userspace, where they belong: udev rules, sysctls, tuned profiles, packages, services and UI.',
        ],
      },
      {
        title: 'Unattended installs',
        body: [
          'SmoothISO supports an unattended boot entry alongside the interactive installer, with the target disk and initial credentials supplied at build time — useful for lab rebuilds and for shipping preconfigured hardware.',
        ],
      },
    ],
  },
];

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
