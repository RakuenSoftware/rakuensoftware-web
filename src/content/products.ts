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
  /** One-paragraph pitch used on the home page card and the hero. */
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
    slug: 'aimee',
    name: 'aimee',
    tagline: 'Memory, a code graph and guardrails for any AI coding tool',
    summary:
      'Your AI tool starts every session knowing nothing. aimee gives it memory that survives, a queryable map of your code, and limits it cannot write past. Point any tool at it and your context follows you between them.',
    repo: 'https://github.com/RakuenSoftware/aimee',
    features: [
      {
        icon: '🧠',
        title: 'Memory that survives',
        body: 'A curator distills every session into a typed knowledge base. It dedupes facts, flags contradictions and lets stale detail decay. You stop re-explaining your own project.',
      },
      {
        icon: '🕸️',
        title: 'Your code as a graph',
        body: 'aimee indexes symbols and calls across every repo you point it at. The AI finds callers and traces the blast radius of an edit before it writes a line.',
      },
      {
        icon: '💸',
        title: 'Cut the bill',
        body: 'Route review, summarisation and boilerplate to the cheapest model that can do the job. A model on your own GPU, or a plan you already pay for, costs nothing extra. The primary gets a compact result back.',
      },
      {
        icon: '🚦',
        title: 'Guardrails it cannot talk past',
        body: '.env files, keys and prod configs are blocked before the model touches them. Planning mode freezes writes. Every session runs fully isolated.',
      },
      {
        icon: '🔌',
        title: 'Any model, any tool',
        body: 'Point an OpenAI- or Anthropic-compatible client at aimee and run the turn on Claude, GPT, Gemini or a model on your own hardware. Or run aimee beside your tool over MCP or ACP and it keeps its own model.',
      },
      {
        icon: '🖥️',
        title: 'A workspace in the browser',
        body: 'aimee-webchat gives you chat, a live code graph, a git project manager, an in-app VS Code editor and dashboards. No terminal required.',
      },
    ],
    sections: [
      {
        title: 'Two parts',
        body: ['aimee ships as a personal assistant and a shared knowledge base. Run one or both.'],
        bullets: [
          'aimee-server is an assistant to one human. It learns how you work and what you expect, and it is strongest across large or multi-repo codebases.',
          'aimee-kb is a knowledge base for a whole corpus: a subject, a company, a team. Point everyone at one kb and the team works from the same memory.',
        ],
      },
      {
        title: 'Workflows that end in a pull request',
        body: [
          'Compose a job from typed steps and aimee runs it through to a PR. Put review panels and human sign-off gates wherever you want them, so the parts you care about still cross your desk.',
        ],
      },
      {
        title: 'It runs on your hardware',
        body: [
          'Embeddings, reranking and synthesis run in one container, CPU or GPU. The knowledge base curates locally with no outside API calls.',
          'Core services are C. Hot paths run in single-digit milliseconds. Nothing phones home. Licensed under the AGPL v3.0.',
        ],
      },
      {
        title: 'Start with one container',
        body: [
          'Bring up aimee-server with a single compose command. A browser wizard handles the rest: pick a primary agent, choose CPU or GPU, connect a git host, pick your workspaces. Then install the CLI on each dev machine and point it at the server.',
        ],
      },
    ],
  },
  {
    slug: 'smoothnas',
    name: 'SmoothNAS',
    tagline: 'A storage appliance that still feels like Linux',
    summary:
      'SmoothNAS runs your storage on mdadm, LVM and ZFS, and puts a browser UI in front of them. You get the appliance experience without losing the tools underneath, so the system stays inspectable and recoverable when something goes wrong.',
    repo: 'https://github.com/RakuenSoftware/smoothnas',
    features: [
      {
        icon: '🧱',
        title: 'Four storage models',
        body: 'mdadm arrays, named tiers across NVMe, SSD and HDD, smoothfs pools presented as one mount, and full ZFS with datasets, zvols and snapshots. Pick per workload instead of forcing everything into one abstraction.',
      },
      {
        icon: '🌡️',
        title: 'Tiering that runs in the kernel',
        body: 'tierd provisions the backings and drives placement, movement and heat tracking through generic-netlink straight to the smoothfs module. There is no user-space filesystem daemon in the data path.',
      },
      {
        icon: '🔗',
        title: 'Share it any way you like',
        body: 'Publish over SMB, NFS and iSCSI. Schedule backups with live progress, throughput and a working cancel button.',
      },
      {
        icon: '🔌',
        title: 'Run apps on the box',
        body: 'Managed plugins run co-located apps in isolated containers: local LLM inference, CI runners, media tools. Your NAS stops being a single-purpose appliance.',
      },
      {
        icon: '📊',
        title: 'Know what your disks are doing',
        body: 'SMART health and alerting, idle spin-down to save power, and benchmarking of local and remote targets with live fio-driven telemetry.',
      },
      {
        icon: '💽',
        title: 'Installs itself',
        body: 'A custom Debian installer that can mirror the OS with RAID-1 and leaves your non-OS disks free for managed storage. English or Dutch UI.',
      },
    ],
    sections: [
      {
        title: 'Pick the storage model per workload',
        body: ['Different data wants different tradeoffs, so SmoothNAS supports four paths rather than one.'],
        bullets: [
          'mdadm arrays for straightforward RAID-backed storage.',
          'Named tiers with slot-based assignment when you want to design fast, warm and cold explicitly.',
          'smoothfs pools when you want tiering handled for you behind a single mount.',
          'ZFS when you want pools, datasets, zvols and snapshots.',
        ],
      },
      {
        title: 'Who it is for',
        body: [
          'A homelab NAS that stays understandable under failure. A workstation-side appliance with mixed NVMe, SSD and HDD. A small office file server managed from a browser.',
          'It is not trying to be a distributed storage system, a cloud control plane, or a turnkey enterprise SAN.',
        ],
      },
    ],
  },
  {
    slug: 'smoothrouter',
    name: 'SmoothRouter',
    tagline: 'Your router, running real Debian, managed from a browser',
    summary:
      'Consumer firmware locks you out and BSD appliances hand you a frozen port tree. SmoothRouter is Debian running the Linux networking stack, with a web UI in front of nftables, dnsmasq and PPPoE.',
    status: 'Private beta',
    features: [
      {
        icon: '🛡️',
        title: 'nftables firewall and NAT',
        body: 'Firewalling and NAT run on the modern Linux packet filter, configured from the UI and readable from a shell.',
      },
      {
        icon: '🌐',
        title: 'DNS and DHCP together',
        body: 'dnsmasq serves resolution and leases, managed and applied from the Network, DNS and DHCP pages.',
      },
      {
        icon: '🔗',
        title: 'PPPoE that just works',
        body: 'First-class PPPoE for DSL and fibre lines that need a session rather than plain DHCP, instead of an afterthought bolted onto a LAN-first design.',
      },
      {
        icon: '🚫',
        title: 'Block ads for every device',
        body: 'DNS blocklists apply network-wide at the resolver. Phones, TVs and guest laptops are covered without installing anything on them.',
      },
      {
        icon: '📈',
        title: 'Monitoring and health built in',
        body: 'The routerd daemon carries its own monitoring and health checks, so you can see what the router is actually doing.',
      },
      {
        icon: '🔄',
        title: 'Updates without surgery',
        body: 'An updater service keeps the appliance current, so staying patched does not mean a hand-driven package session over SSH.',
      },
    ],
    sections: [
      {
        title: 'What is under the hood',
        body: [
          'routerd is a Go daemon covering network, DNS, DHCP, firewall, PPPoE, resolver, blocklist, monitoring, health, updates and the API. routerd-ui is a React app built on SmoothGUI, with pages for Dashboard, Network, DNS, DHCP, Firewall and System.',
          'It runs the same kernel as SmoothNAS through SmoothKernel, so driver coverage and firmware baseline carry across both products.',
        ],
      },
      {
        title: 'The admin UI never appears on your WAN',
        body: [
          'On first boot nothing is listening. Every interface except loopback stays down and the management daemon stays stopped. A console wizard identifies your interfaces and assigns WAN and LAN before anything starts serving.',
          'A router that guesses which port faces the internet gets that guess wrong eventually. SmoothRouter does not guess.',
        ],
      },
      {
        title: 'Who it is for',
        body: [
          'Homelab, small office and prosumer networks, on hardware you chose. It is not competing with consumer routers on price.',
        ],
      },
    ],
  },
  {
    slug: 'smoothfs',
    name: 'SmoothFS',
    tagline: 'One mount point, fast disks and cheap disks underneath',
    summary:
      'SmoothFS is a stacked kernel filesystem that presents tiered storage as a single mount and moves files between tiers on its own. Buy capacity on cheap media and speed on fast media, and let the filesystem work out what belongs where.',
    repo: 'https://github.com/RakuenSoftware/smoothfs',
    features: [
      {
        icon: '⚡',
        title: 'Placement by heat',
        body: 'Hot data sits on SSD and NVMe, cold data moves to slower media. Heat tracking runs in the kernel, not in a nightly script.',
      },
      {
        icon: '🔗',
        title: 'Your shares do not notice',
        body: 'NFS, SMB and iSCSI behave exactly as they did. Applications see one mount and nothing else changes.',
      },
      {
        icon: '🛟',
        title: 'Movement you can recover from',
        body: 'Every move is an explicit state transition with a defined recovery path, including active-LUN movement. You can reason about what happens after a crash.',
      },
      {
        icon: '⚙️',
        title: 'No daemon in the data path',
        body: 'tierd drives the module over generic-netlink from the control plane. There is no user-space filesystem daemon sitting between your data and the disk.',
      },
      {
        icon: '💷',
        title: 'Spend where it counts',
        body: 'Mixed hardware stops being a compromise. Add a small fast tier to a large slow pool and get most of the benefit of an all-flash array.',
      },
      {
        icon: '📦',
        title: 'Built on the appliance',
        body: 'Developed as a standalone project and built on SmoothNAS through DKMS, so it tracks the kernel rather than pinning you to one.',
      },
    ],
    sections: [
      {
        title: 'Why it lives in the kernel',
        body: [
          'A cache layer in user space has to guess at access patterns and pays a context switch for the privilege. SmoothFS tracks heat in the kernel and stacks over the tiers directly, so placement decisions cost close to nothing and survive a reboot.',
        ],
      },
      {
        title: 'Where it fits',
        body: [
          'SmoothFS is the data plane for SmoothNAS tiered pools. tierd handles provisioning the per-tier backings with mdadm, LVM or ZFS, writes the mount unit, and then hands placement to the module.',
        ],
      },
    ],
  },
  {
    slug: 'nonraid',
    name: 'nonraid',
    tagline: 'Parity protection without giving up whole-disk filesystems',
    summary:
      'nonraid gives you Unraid-style arrays: every data disk keeps its own complete filesystem, protected by one to three parity disks. Mix disk sizes freely, and if you lose more disks than parity covers, you lose those disks rather than the array.',
    repo: 'https://github.com/RakuenSoftware/nonraid',
    features: [
      {
        icon: '🧩',
        title: 'Every disk stands alone',
        body: 'Each data disk holds a complete filesystem. A failure beyond your parity count costs you those disks, not everything you own.',
      },
      {
        icon: '🛡️',
        title: 'Up to three parity disks',
        body: 'Choose your protection level. The only rule is that no data disk may exceed your smallest parity disk.',
      },
      {
        icon: '📐',
        title: 'Bring the disks you have',
        body: 'Data disks do not need to match each other. Grow the array with whatever is on the shelf instead of buying matched sets.',
      },
      {
        icon: '⚙️',
        title: 'A real parity engine',
        body: 'Galois-field arithmetic and the parity engine are written to be correct and tested on their own, away from any appliance.',
      },
      {
        icon: '🔌',
        title: 'Linux NBD transport',
        body: 'The array is exposed through NBD, so the storage layer stays independent of the control plane driving it.',
      },
      {
        icon: '📦',
        title: 'Useful outside the appliance',
        body: 'It is a standalone Go module. SmoothNAS is the first consumer, not the only possible one.',
      },
    ],
    sections: [
      {
        title: 'A deliberate split',
        body: [
          'nonraid stops at the storage layout. It ships the layout validator, the parity engine, the Galois-field maths and the NBD transport, which are the parts worth proving correct.',
          'SmoothNAS owns the appliance-specific work on top: control plane, database rows, API handlers and mount orchestration. Keeping them apart is what makes the parity engine testable in isolation.',
        ],
      },
    ],
  },
  {
    slug: 'smoothgui',
    name: 'SmoothGUI',
    tagline: 'One component library for consoles, installers and websites',
    summary:
      'SmoothGUI is the React library every Rakuen Software product is built from. It covers the appliance console, the installer that runs before the appliance exists, and this website, so one fix lands everywhere.',
    repo: 'https://github.com/RakuenSoftware/smoothgui',
    features: [
      {
        icon: '🎛️',
        title: 'Console primitives',
        body: 'AppShell, Panel, DataTable, Wizard, Drawer, Picker, Tabs, Toast, ConfirmDialog and SettingsMenu. The full vocabulary for administering an appliance.',
      },
      {
        icon: '📄',
        title: 'Site and long-form primitives',
        body: 'SiteHeader, SiteFooter, Hero, Section, FeatureGrid, Card, Prose, ArticleCard, CodeBlock and CallToAction, added in 0.9.0.',
      },
      {
        icon: '🎨',
        title: 'Tokens in both worlds',
        body: 'One design token set exported twice: as CSS custom properties for stylesheets and as typed JavaScript values for inline styles.',
      },
      {
        icon: '🔒',
        title: 'Auth already solved',
        body: 'A login page, forced password change and an auth context ship with the library, so no product reinvents the session flow.',
      },
      {
        icon: '🌍',
        title: 'English and Dutch',
        body: 'A built-in i18n context with both catalogues included, extensible per product.',
      },
      {
        icon: '🧭',
        title: 'Bring your own router',
        body: 'The library never imports a router. Navigational components take an optional linkComponent, so you get a plain anchor by default and client-side routing when you want it.',
      },
    ],
    sections: [
      {
        title: 'One library, three jobs',
        body: [
          'SmoothGUI began as the console vocabulary for SmoothNAS. It now ships a dedicated installer build that SmoothISO renders product installers from, and the site primitives behind rakuensoftware.com.',
          'Making one library do all three is a hard constraint on purpose. A component that only works inside a sidebar layout does not belong in a shared library, and building a public site out of a console library finds those quickly.',
        ],
      },
    ],
  },
  {
    slug: 'smoothiso-smoothkernel',
    name: 'SmoothISO & SmoothKernel',
    tagline: 'The installer and the kernel behind every Smooth* product',
    summary:
      'SmoothISO turns any product into a bootable Debian installer. SmoothKernel builds the one kernel line they all install. Four appliances share two pipelines instead of maintaining eight.',
    repo: 'https://github.com/RakuenSoftware/smoothiso',
    features: [
      {
        icon: '💿',
        title: 'Installers from a config',
        body: 'Export a product name, an ID, a version and a hooks directory, then exec the builder. SmoothISO knows nothing about your product.',
      },
      {
        icon: '🪝',
        title: 'Hooks, not forks',
        body: 'Product behaviour is injected through packages.sh and configure.sh. Nobody maintains a private branch of the ISO builder.',
      },
      {
        icon: '🤖',
        title: 'Unattended installs',
        body: 'An unattended boot entry sits alongside the interactive one, with target disk and initial credentials set at build time. Useful for lab rebuilds and preconfigured hardware.',
      },
      {
        icon: '🐧',
        title: 'One kernel, four flavours',
        body: 'SmoothKernel builds canonical amd64 and arm64 configs and one ordered patch stack into Debian packages that SmoothNAS, SmoothRouter, SmoothHTPC and SmoothDesktop all install.',
      },
      {
        icon: '🧬',
        title: 'Every patch visible in git',
        body: 'A pristine kernel.org base plus vendored patch lanes: a CachyOS base lane, narrow HID and controller cherry-picks, then local carry patches. Nothing arrives from nowhere.',
      },
      {
        icon: '🔏',
        title: 'Secure Boot without secrets in the repo',
        body: 'A documented path for module signing that keeps private keys out of version control, plus DKMS-friendly headers for OpenZFS, smoothfs and NVIDIA.',
      },
    ],
    sections: [
      {
        title: 'Why share them',
        body: [
          'SmoothNAS, SmoothRouter and the HTPC and desktop flavours all need an installer and a kernel. Four installer pipelines and four kernel pipelines would drift apart within a release or two.',
          'There is one of each instead. Flavour differences stay in userspace where they belong: udev rules, sysctls, tuned profiles, packages, services and UI.',
        ],
      },
      {
        title: 'Scope',
        body: [
          'SmoothKernel owns the configs, the patch lanes, the kernel and OpenZFS build recipes, and the DKMS templates. It does not own per-flavour services, UI, per-product CI, signing keys or out-of-tree module source. Those live in the product repos.',
          'Most people never build it. SmoothKernel arrives through the Smooth* apt repository like any other package.',
        ],
      },
    ],
  },
];

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
