export interface ProductFeature { title: string; body: string; }
export interface ProductSection { title: string; body: string[]; bullets?: string[]; }
export interface ProductResource { label: string; href: string; }
export type ProductGroup = 'systems' | 'libraries' | 'platform';
export interface Product {
  slug: string;
  name: string;
  group: ProductGroup;
  tagline: string;
  summary: string;
  repo?: string;
  status?: string;
  sourcePolicy?: string;
  features: ProductFeature[];
  sections: ProductSection[];
  resources: ProductResource[];
  related: string[];
}

export const PRODUCT_GROUPS: { id: ProductGroup; title: string; description: string }[] = [
  { id: 'systems', title: 'Systems you operate', description: 'Persistent AI work, storage and networking on infrastructure you control.' },
  { id: 'libraries', title: 'Independent building blocks', description: 'Local messaging, tiered storage and parity engines. Use them inside our products or build something of your own.' },
  { id: 'platform', title: 'The shared platform', description: 'Interfaces, installation, kernels, package delivery and applications that connect the stack.' },
];

export const PRODUCTS: Product[] = [
  {
    "slug": "aimee",
    "name": "aimee",
    "group": "systems",
    "tagline": "A persistent working environment for your AI tools",
    "summary": "Keep memory, code intelligence, sessions and workflows in a runtime you operate. Change your model or coding client while carrying the work forward, with authorization and an action trail owned by the runtime.",
    "features": [
      {
        "title": "Memory you can correct",
        "body": "Keep decisions, facts and rules with scope, provenance and revisions. Review corrections and retire outdated records so future recall uses the current state."
      },
      {
        "title": "Code intelligence across repositories",
        "body": "Investigate a published index of symbols, callers, imports and text. Trace the blast radius of a change; rescan when the source changes."
      },
      {
        "title": "Governed execution",
        "body": "Registered tools check capabilities, workspace and policy. Write-capable delegates require container isolation, with credentials held by the owning instance’s Vault."
      },
      {
        "title": "Durable workflows",
        "body": "Run versioned workflows with retries, artifacts, review panels and human gates. Execution state survives individual model calls."
      },
      {
        "title": "Keep your preferred client",
        "body": "Connect over MCP, ACP, compatible model APIs or the named HTTP API. Governance covers actions made through aimee; independent client actions remain outside that boundary."
      },
      {
        "title": "Local models and replaceable memory",
        "body": "Use local or hosted model providers. Native memory is the default, with a generic retrieval-engine contract and optional native attention memory for supported local model bundles."
      }
    ],
    "sections": [
      {
        "title": "Start personal. Share deliberately.",
        "body": [
          "A standalone Server owns your sessions, personal memory, private code index, credentials, tools and delegates. It works without a shared knowledge server.",
          "An optional KB owns a shared corpus of documents, memories and code graphs. Personal and shared stores retain separate identities and authorization; attaching a KB does not move your personal records."
        ]
      },
      {
        "title": "A runtime with explicit boundaries",
        "body": [
          "The C resource host and Go control-plane modules divide enforcement, memory and workflow ownership. ouroboros-ring provides the independently versioned local message transport.",
          "The CLI and browser are clients of the same runtime. Use the integration and security guides to check what your chosen client exposes and what aimee governs."
        ]
      },
      {
        "title": "Run it on infrastructure you own",
        "body": [
          "The standard Docker composition starts Server, PostgreSQL and local embedding. Shared knowledge and synthesis are optional. Follow the current quickstart for credential generation, Vault initialization and first-boot login.",
          "Native attention memory depends on a compatible model, plugin and runtime bundle. Check the release documentation for the supported combinations."
        ]
      }
    ],
    "related": [
      "ouroboros-ring",
      "smoothnas-plugins"
    ],
    "resources": [
      {
        "label": "Quickstart",
        "href": "https://github.com/RakuenSoftware/aimee/blob/testing/docs/QUICKSTART.md"
      },
      {
        "label": "Compatibility",
        "href": "https://github.com/RakuenSoftware/aimee/blob/testing/docs/COMPATIBILITY.md"
      },
      {
        "label": "Security boundaries",
        "href": "https://github.com/RakuenSoftware/aimee/blob/testing/docs/SECURITY.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/aimee"
  },
  {
    "slug": "smoothnas",
    "name": "SmoothNAS",
    "group": "systems",
    "tagline": "Storage, sharing and applications on a Linux appliance",
    "summary": "Manage mdadm, LVM, ZFS and SmoothFS from a browser. Build storage around your workloads, publish SMB, NFS and iSCSI shares, and run managed applications while keeping the Linux tools underneath accessible.",
    "features": [
      {
        "title": "Choose the storage layout",
        "body": "Create mdadm arrays, named NVMe/SSD/HDD tiers, SmoothFS pools or ZFS pools with datasets, zvols and snapshots."
      },
      {
        "title": "Tier or cache with SmoothFS",
        "body": "Use one namespace over mixed media. Tiering moves authoritative files; cache mode keeps permanent storage on the base tier and uses fast storage for staging and read replicas."
      },
      {
        "title": "Share and back up",
        "body": "Publish SMB, NFS and iSCSI storage, and schedule backups with progress, throughput and cancellation controls."
      },
      {
        "title": "Managed application catalog",
        "body": "Deploy aimee, llama.cpp, vLLM, GitHub Actions runners and Wolf through the plugin system. GPU and runtime requirements vary by plugin."
      },
      {
        "title": "Health and power management",
        "body": "Inspect SMART health, alerts, disk activity and fio-driven benchmarks. Idle disk controls and write staging help manage mixed-media systems."
      },
      {
        "title": "Debian installation and updates",
        "body": "Install through the shared SmoothISO pipeline, including mirrored OS storage. Consume packaged updates and use the English or Dutch interface."
      }
    ],
    "sections": [
      {
        "title": "Storage policy above familiar tools",
        "body": [
          "tierd handles appliance orchestration and talks to the SmoothFS kernel module over generic-netlink. mdadm, LVM and ZFS remain separate tools with their own recovery paths.",
          "nonraid supplies the independent parity engine and layout contracts for per-disk filesystems. SmoothNAS owns the appliance integration."
        ]
      },
      {
        "title": "An appliance that can run more than storage",
        "body": [
          "The plugin catalog brings inference, automation and game-streaming workloads to the same host. Plugins have their own releases, profiles and hardware requirements.",
          "SmoothFS active-LUN movement is opt-in and subject to the documented rollout gates. Check the support matrix before enabling it."
        ]
      }
    ],
    "related": [
      "smoothfs",
      "nonraid",
      "smoothnas-plugins",
      "smoothiso",
      "smoothkernel",
      "smoothapt"
    ],
    "resources": [
      {
        "label": "Project guide",
        "href": "https://github.com/RakuenSoftware/smoothnas/blob/testing/README.md"
      },
      {
        "label": "Compose plugins",
        "href": "https://github.com/RakuenSoftware/smoothnas/blob/testing/docs/compose-plugins.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothnas"
  },
  {
    "slug": "smoothrouter",
    "name": "SmoothRouter",
    "group": "systems",
    "tagline": "Debian networking with a browser control plane",
    "summary": "Manage routing, nftables firewalling, DNS, DHCP, PPPoE and outbound VPN connections on hardware you choose. SmoothRouter supports regular and VPN gateways for LAN clients. Its source remains private, and distribution is limited to specific opt-in arrangements.",
    "features": [
      {
        "title": "Firewall and NAT",
        "body": "Configure nftables policy and inspect the resulting Linux rules from a shell."
      },
      {
        "title": "DNS, DHCP and filtering",
        "body": "Manage dnsmasq resolution and leases, with resolver blocklists for network-wide filtering."
      },
      {
        "title": "PPPoE uplinks",
        "body": "Configure session-based internet connections alongside the rest of the network settings."
      },
      {
        "title": "Reusable VPN profiles",
        "body": "Configure outbound OpenVPN connections independently of the LAN gateways that use them."
      },
      {
        "title": "Selectable LAN VPN gateways",
        "body": "Give clients distinct gateway addresses for regular internet or a VPN profile. VPN gateways carry IPv4 traffic and block internet forwarding when their tunnel is unavailable."
      },
      {
        "title": "Offline installation",
        "body": "The installer can carry its package set and ask you to choose the LAN interface and address without requiring an internet connection."
      }
    ],
    "sections": [
      {
        "title": "Configure the LAN explicitly",
        "body": [
          "The installer asks which interface serves the LAN rather than assuming a port assignment. The browser then exposes network, firewall, DNS, DHCP, VPN and system controls."
        ]
      },
      {
        "title": "Specific opt-in distribution",
        "body": [
          "Distribution is limited to specific opt-in arrangements and may never expand beyond them. There is no commitment to a general public release. Its repository and package archive require authorized access.",
          "It shares SmoothKernel, SmoothISO and SmoothGUI with the rest of the appliance platform."
        ]
      }
    ],
    "related": [
      "smoothiso",
      "smoothkernel",
      "smoothgui",
      "smoothapt"
    ],
    "resources": [],
    "status": "Limited opt-in",
    "sourcePolicy": "Rakuen Software is deeply committed to public and open source code. SmoothRouter is the sole exception: it is a public-facing security device, and the authors consider publishing its code in the current cybersecurity climate a fundamentally different security proposition. Given recent privacy and security concerns, they are not convinced that a public release is wise. SmoothRouter’s source code will not be released."
  },
  {
    "slug": "ouroboros-ring",
    "name": "ouroboros-ring",
    "group": "libraries",
    "tagline": "A shared-memory contract for programs on one host",
    "summary": "Connect separate processes through typed events and shared memory. One C host admits clients and routes messages; independent C, pure-Go and Rust clients implement the same versioned contract. aimee is one consumer, and the ring stands on its own.",
    "features": [
      {
        "title": "One host, private queue pairs",
        "body": "The host owns the memory and admission. Each admitted client maps its own queue pair and the shared payload arena."
      },
      {
        "title": "C, Go and Rust",
        "body": "Use a C11 host and client, a Go client without cgo, or the Rust client and module runtime. Go and Rust do not implement competing hosts."
      },
      {
        "title": "A contract you can implement",
        "body": "The specification and frozen layout vectors define the wire, layout and module protocol independently of any language implementation."
      },
      {
        "title": "Routing and flow control",
        "body": "Typed event routing and backpressure let processes communicate within one host with explicit queue behavior."
      },
      {
        "title": "Large payloads and module calls",
        "body": "Use arena payloads, module callers and runtimes. The C library also provides local attachment, capture flushing and a pool for concurrent module calls."
      },
      {
        "title": "Conformance across languages",
        "body": "Golden vectors, C-host conformance, sanitizer checks and a committed dispatch performance budget check implementations against the contract."
      }
    ],
    "sections": [
      {
        "title": "Local transport, independently released",
        "body": [
          "ouroboros-ring began inside aimee and now has its own repository, specification, tests and releases. Consumers pin a release rather than relying on aimee’s internal source.",
          "It is a POSIX/Linux shared-memory transport for programs on the same host. Use a network protocol for communication between machines."
        ]
      },
      {
        "title": "Choose the implementation that fits",
        "body": [
          "C installs host and client libraries with CMake and pkg-config support. Go exposes a normal module with no cgo. Rust provides a client crate depending on libc.",
          "Repository releases and protocol versions are tracked separately. Hosts and clients negotiate the wire version when attaching; consult the versioning guide before upgrading."
        ]
      }
    ],
    "related": [
      "aimee"
    ],
    "resources": [
      {
        "label": "Documentation",
        "href": "https://github.com/RakuenSoftware/ouroboros-ring/blob/main/docs/README.md"
      },
      {
        "label": "Contract",
        "href": "https://github.com/RakuenSoftware/ouroboros-ring/blob/main/spec/README.md"
      },
      {
        "label": "Architecture",
        "href": "https://github.com/RakuenSoftware/ouroboros-ring/blob/main/docs/architecture.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/ouroboros-ring",
    "status": "Early development"
  },
  {
    "slug": "smoothfs",
    "name": "SmoothFS",
    "group": "libraries",
    "tagline": "One namespace, with tiering or caching underneath",
    "summary": "A stacked Linux kernel filesystem for mixed storage. Move authoritative files between fast and slow tiers, or keep permanent data on a base tier and use fast media for write staging and disposable read replicas.",
    "features": [
      {
        "title": "Tier mode",
        "body": "Each file has one permanent tier. Heat and placement policy guide promotion and demotion across the pool."
      },
      {
        "title": "Cache mode",
        "body": "The last, slowest tier holds permanent data. The fastest tier stages buffered writes and caches reads; it does not add permanent capacity."
      },
      {
        "title": "Write staging and drain",
        "body": "Pending writes remain required data until drained. Sync operations drain staging, and a full cache falls back to base writes."
      },
      {
        "title": "Protocol integration",
        "body": "Support contracts cover NFS, Samba and file-backed iSCSI. Active-LUN movement is opt-in and rollout-gated."
      },
      {
        "title": "Kernel data path",
        "body": "The module handles filesystem operations; the userspace control plane drives planning, provisioning and recovery through generic-netlink."
      },
      {
        "title": "Packaged for Debian",
        "body": "DKMS and native Samba VFS packages target the documented kernel, architecture and Samba combinations."
      }
    ],
    "sections": [
      {
        "title": "Choose the mode when creating the pool",
        "body": [
          "Tier mode expands the permanent namespace across media classes. Cache mode reports permanent capacity from base storage only, while fast media accelerates eligible buffered operations.",
          "An existing tiered pool cannot simply be switched in place. Consolidate and verify its contents on the base layer first, following the operator documentation."
        ]
      },
      {
        "title": "Use the supported combinations",
        "body": [
          "The support matrix defines the lower filesystems, kernel floor, Debian architectures and Samba ABI. Check those combinations before deploying or upgrading.",
          "SmoothNAS provides appliance provisioning and management. SmoothFS remains a separately maintained storage engine with explicit movement and recovery contracts."
        ]
      }
    ],
    "related": [
      "smoothnas",
      "nonraid",
      "smoothkernel"
    ],
    "resources": [
      {
        "label": "Support matrix",
        "href": "https://github.com/RakuenSoftware/smoothfs/blob/main/docs/smoothfs-support-matrix.md"
      },
      {
        "label": "Operator runbook",
        "href": "https://github.com/RakuenSoftware/smoothfs/blob/main/docs/smoothfs-operator-runbook.md"
      },
      {
        "label": "Architecture",
        "href": "https://github.com/RakuenSoftware/smoothfs/blob/main/docs/architecture.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothfs"
  },
  {
    "slug": "nonraid",
    "name": "nonraid",
    "group": "libraries",
    "tagline": "Parity protection with a filesystem on each data disk",
    "summary": "An independent Go implementation of a per-disk storage layout with one to three parity disks. Mix data-disk sizes while keeping each disk’s filesystem separate; SmoothNAS supplies the appliance control plane.",
    "features": [
      {
        "title": "Independent data filesystems",
        "body": "Each data disk owns its own filesystem instead of striping one filesystem across the entire array."
      },
      {
        "title": "One to three parity disks",
        "body": "Choose a protection level. No data disk may exceed the smallest parity disk."
      },
      {
        "title": "Portable engine and Linux transport",
        "body": "The module contains layout validation, parity and Galois-field arithmetic, plus Linux NBD transport."
      }
    ],
    "sections": [
      {
        "title": "A focused storage component",
        "body": [
          "nonraid owns the portable layout and parity mechanisms. SmoothNAS owns database rows, API handlers, mount orchestration and the operator interface.",
          "Parity protects against the disk failures covered by the chosen layout. Keep independent backups for data you need to recover."
        ]
      }
    ],
    "related": [
      "smoothnas",
      "smoothfs"
    ],
    "resources": [
      {
        "label": "Project guide",
        "href": "https://github.com/RakuenSoftware/nonraid/blob/main/README.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/nonraid"
  },
  {
    "slug": "smoothgui",
    "name": "SmoothGUI",
    "group": "platform",
    "tagline": "Shared React components for consoles, installers and websites",
    "summary": "Build appliance consoles, installation flows and public websites from the same React library. Shared design tokens, themes and reusable components keep the interface consistent across Rakuen Software.",
    "features": [
      {
        "title": "Administration components",
        "body": "App shells, panels, data tables, wizards, drawers, pickers, tabs, toasts and confirmation dialogs for appliance operations."
      },
      {
        "title": "Public-site components",
        "body": "Headers, footers, heroes, sections, feature grids, prose, article cards and calls to action power this website."
      },
      {
        "title": "Shared themes and tokens",
        "body": "CSS custom properties and typed JavaScript tokens provide the same visual vocabulary, with shared theme controls."
      },
      {
        "title": "Authentication UI",
        "body": "Reusable login, password-change and authentication context components support product session flows."
      },
      {
        "title": "English and Dutch",
        "body": "Built-in translation catalogs can be extended with product-specific messages."
      },
      {
        "title": "Navigation adapters",
        "body": "Site navigation accepts a link component so products can connect their router to shared UI primitives."
      }
    ],
    "sections": [
      {
        "title": "The library behind this site",
        "body": [
          "SmoothGUI began with SmoothNAS administration. It also builds the SmoothISO installer frontend and the public site you are reading.",
          "Shared components keep improvements to accessibility, layout and interaction available to every consumer."
        ]
      }
    ],
    "related": [
      "smoothnas",
      "smoothrouter",
      "smoothiso"
    ],
    "resources": [
      {
        "label": "Source and components",
        "href": "https://github.com/RakuenSoftware/smoothgui/blob/main/package.json"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothgui"
  },
  {
    "slug": "smoothiso",
    "name": "SmoothISO",
    "group": "platform",
    "tagline": "Product installers from one Debian-based pipeline",
    "summary": "Build a bootable appliance installer from product configuration and hooks. SmoothISO owns the common installation flow, while each product supplies its packages, configuration and first-boot behavior.",
    "features": [
      {
        "title": "Configuration and hooks",
        "body": "Product wrappers set identity, version and build paths. Hooks inject packages and configuration without forking the installer."
      },
      {
        "title": "Offline package repository",
        "body": "An offline build can embed Debian base packages and product dependencies, so installation needs no network connection."
      },
      {
        "title": "Interactive or unattended",
        "body": "Use a SmoothGUI frontend or an unattended boot entry with explicitly configured installation settings."
      },
      {
        "title": "Explicit network policy",
        "body": "Products can disable installer networking and ask the operator to select the LAN interface and address."
      },
      {
        "title": "Product kernel support",
        "body": "Stage a product-built kernel, selected modules and firmware into the installation environment."
      },
      {
        "title": "Shared first-boot flow",
        "body": "The common installer and first-boot scripts let each appliance keep product-specific behavior in its hooks."
      }
    ],
    "sections": [
      {
        "title": "Installers that do not drift apart",
        "body": [
          "SmoothNAS and SmoothRouter consume the same builder. Kernel packaging belongs to SmoothKernel, and runtime configuration stays in the consuming product.",
          "Offline operation is a build choice: every required package must be assembled into the ISO. Builds that defer the browser download still require network access."
        ]
      }
    ],
    "related": [
      "smoothkernel",
      "smoothgui",
      "smoothnas",
      "smoothrouter"
    ],
    "resources": [
      {
        "label": "Build configuration",
        "href": "https://github.com/RakuenSoftware/smoothiso/blob/main/build-iso.sh"
      },
      {
        "label": "Installer",
        "href": "https://github.com/RakuenSoftware/smoothiso/blob/main/installer.sh"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothiso"
  },
  {
    "slug": "smoothkernel",
    "name": "SmoothKernel",
    "group": "platform",
    "tagline": "One Linux kernel pipeline for the Smooth platform",
    "summary": "Build Debian kernel packages from a pristine kernel.org base, canonical architecture configs and an ordered patch stack. The Smooth products share hardware support while keeping their services and policy in userspace.",
    "features": [
      {
        "title": "amd64 and arm64 configs",
        "body": "Canonical per-architecture configurations give downstream products a shared kernel baseline."
      },
      {
        "title": "Visible patch lanes",
        "body": "Vendored CachyOS, selected controller and HID changes, and local carry patches remain inspectable in source control."
      },
      {
        "title": "Kernel and OpenZFS packages",
        "body": "Separate recipes produce Debian kernel, header and OpenZFS packages for appliance integration."
      },
      {
        "title": "Latency-oriented configuration",
        "body": "BORE support and latency-oriented defaults serve the shared appliance and workstation kernel line."
      },
      {
        "title": "DKMS integration",
        "body": "Headers and templates support separately maintained modules such as SmoothFS, OpenZFS and optional NVIDIA drivers."
      },
      {
        "title": "Signing guidance",
        "body": "Secure Boot and module-signing documentation keeps private signing keys outside the repository."
      }
    ],
    "sections": [
      {
        "title": "Shared kernel, product-owned userspace",
        "body": [
          "SmoothKernel owns configurations, patch lanes and build recipes. Appliance services, UI, product release pipelines and out-of-tree module sources belong to their own projects.",
          "Most operators receive these packages through the Smooth apt archive rather than building a kernel themselves."
        ]
      }
    ],
    "related": [
      "smoothiso",
      "smoothapt",
      "smoothfs"
    ],
    "resources": [
      {
        "label": "Project guide",
        "href": "https://github.com/RakuenSoftware/smoothkernel/blob/main/README.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothkernel"
  },
  {
    "slug": "smoothapt",
    "name": "smoothapt",
    "group": "platform",
    "tagline": "Verified package delivery for the Smooth family",
    "summary": "The package archive at updates.rakuensoftware.com ingests Smooth project releases and publishes their Debian packages unchanged. Verification and signed archive metadata connect the release pipeline to appliance updates.",
    "features": [
      {
        "title": "Public and restricted suites",
        "body": "Public suites distribute SmoothKernel and SmoothNAS packages. SmoothRouter uses a separate archive requiring authorized access."
      },
      {
        "title": "Verify before admission",
        "body": "Public projects use build-provenance attestation checks. Private release admission checks the Actions uploader and GitHub-recorded package digests."
      },
      {
        "title": "Preserve upstream artifacts",
        "body": "The archive does not rebuild or re-version packages. Archive Release metadata is signed separately for apt clients."
      }
    ],
    "sections": [
      {
        "title": "From release to appliance",
        "body": [
          "The ingestion service checks releases, downloads Debian artifacts and rejects a release if its required verification fails. Signed Release metadata gives apt clients an authenticated archive index.",
          "Use the project’s current source and keyring configuration. Package access and transport settings depend on the suite."
        ]
      }
    ],
    "related": [
      "smoothkernel",
      "smoothnas",
      "smoothrouter"
    ],
    "resources": [
      {
        "label": "Archive setup",
        "href": "https://github.com/RakuenSoftware/smoothapt/blob/main/README.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/smoothapt"
  },
  {
    "slug": "smoothnas-plugins",
    "name": "SmoothNAS plugins",
    "group": "platform",
    "tagline": "Inference, automation and streaming beside your storage",
    "summary": "Extend SmoothNAS with separately released application packages. The catalog includes aimee, llama.cpp, vLLM, GitHub Actions runners and Games-on-Whales Wolf, with runtime and GPU profiles matched to the workload.",
    "features": [
      {
        "title": "AI tools and inference",
        "body": "Run aimee components or serve local models with llama.cpp and vLLM. Available acceleration depends on the plugin variant and host GPU."
      },
      {
        "title": "Self-hosted automation",
        "body": "Install GitHub Actions runner packages on your own infrastructure alongside managed storage."
      },
      {
        "title": "Game streaming integration",
        "body": "Wolf packaging supports NVIDIA, AMD and Intel variants for Moonlight clients. It wraps the upstream Games-on-Whales project."
      }
    ],
    "sections": [
      {
        "title": "Packages with their own lifecycle",
        "body": [
          "Each plugin repository owns its manifests, images and releases. SmoothNAS supplies installation, configuration, storage placement and runtime profiles.",
          "Check each plugin’s documentation for hardware requirements, permissions and live-host qualification. A catalog entry does not imply that every device or runtime combination is supported."
        ]
      }
    ],
    "related": [
      "smoothnas",
      "aimee"
    ],
    "resources": [
      {
        "label": "aimee packages",
        "href": "https://github.com/RakuenSoftware/smoothnas-plugin-aimee"
      },
      {
        "label": "llama.cpp packages",
        "href": "https://github.com/RakuenSoftware/smoothnas-plugin-llama-cpp"
      },
      {
        "label": "vLLM packages",
        "href": "https://github.com/RakuenSoftware/smoothnas-plugin-vllm"
      },
      {
        "label": "GitHub Actions runners",
        "href": "https://github.com/RakuenSoftware/smoothnas-plugin-gh-runner"
      },
      {
        "label": "Wolf packages",
        "href": "https://github.com/RakuenSoftware/smoothnas-plugin-wolf"
      }
    ]
  }
];

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}
