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
  /** SPDX identifier of the license in the repository, when it carries one. */
  license?: string;
  status?: string;
  sourcePolicy?: string;
  features: ProductFeature[];
  sections: ProductSection[];
  resources: ProductResource[];
  related: string[];
}

export const PRODUCT_GROUPS: { id: ProductGroup; title: string; description: string }[] = [
  { id: 'systems', title: 'Systems you operate', description: 'Each runs on your hardware and does one job: AI working state, storage or networking.' },
  { id: 'libraries', title: 'Independent building blocks', description: 'Components the systems are built from, released separately so you can use them in your own software.' },
  { id: 'platform', title: 'The shared platform', description: 'The interface library, installer, kernel and package archive the appliances share, and the SmoothNAS application catalog.' },
];

export const PRODUCTS: Product[] = [
  {
    "slug": "aimee",
    "name": "Aimee",
    "group": "systems",
    "tagline": "A persistent working environment for your AI tools",
    "summary": "Aimee keeps your AI tools' memory, code index, sessions and workflows on a server you run. Change the model or the coding client and the work carries over. Every action an agent takes through Aimee traces back to its run, identity and authorization.",
    "features": [
      {
        "title": "Memory you can correct",
        "body": "Decisions, facts and rules are stored with their scope, source and revision history. Correct a record and future recall uses the correction."
      },
      {
        "title": "Code intelligence across repositories",
        "body": "Search an index of symbols, callers, imports and text, and trace what a change will touch. Rescan when the source changes."
      },
      {
        "title": "Governed execution",
        "body": "Every tool call is checked against the caller's capabilities, workspace and policy. Delegates that can write run in containers, and credentials stay in the server's vault."
      },
      {
        "title": "Durable workflows",
        "body": "Workflows are versioned and can retry, keep artifacts, convene review panels and wait for a human decision. Their state survives any single model call."
      },
      {
        "title": "Keep your preferred client",
        "body": "Connect over MCP, ACP, compatible model APIs or Aimee's HTTP API. Aimee governs what is done through it. What your client does on its own stays outside that boundary."
      },
      {
        "title": "Local models and replaceable memory",
        "body": "Use local or hosted models. The built-in memory engine is the default, and a documented interface lets another retrieval engine replace it. A vLLM plugin lets supported local models read memory directly in attention."
      }
    ],
    "sections": [
      {
        "title": "Start personal. Share deliberately.",
        "body": [
          "One Aimee server holds your sessions, personal memory, private code index, credentials, tools and delegates. It needs nothing else to run.",
          "A shared knowledge base is optional. It holds documents, memories and code graphs for a team. Personal and shared records keep separate identities and permissions, and connecting a knowledge base does not move your personal records into it."
        ]
      },
      {
        "title": "One server, every client",
        "body": [
          "The CLI and the browser are both clients of the same server, so a different interface cannot get around its checks. Local components talk over ouroboros-ring, which is released on its own.",
          "The integration and security guides say what each client exposes and what Aimee governs."
        ]
      },
      {
        "title": "Run it on infrastructure you own",
        "body": [
          "The standard Docker Compose setup starts the server, PostgreSQL and a local embedding model. Shared knowledge and a synthesis model are optional. The quickstart covers credential generation, vault setup and first login.",
          "Attention memory needs a supported model, plugin and runtime bundle. The release notes list the combinations."
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
    "repo": "https://github.com/RakuenSoftware/aimee",
    "license": "AGPL-3.0"
  },
  {
    "slug": "smoothnas",
    "name": "SmoothNAS",
    "group": "systems",
    "tagline": "Storage, sharing and applications on a Linux appliance",
    "summary": "A Debian storage appliance you manage from a browser. Build arrays and pools with mdadm, LVM, ZFS or SmoothFS, share them over SMB, NFS and iSCSI, and run applications beside them. The Linux tools underneath stay available from a shell.",
    "features": [
      {
        "title": "Choose the storage layout",
        "body": "Create mdadm arrays, NVMe, SSD and HDD tiers, SmoothFS pools, or ZFS pools with datasets, zvols and snapshots."
      },
      {
        "title": "Tier or cache with SmoothFS",
        "body": "One namespace over mixed media. Tier mode moves files between fast and slow disks. Cache mode keeps every file on the slow disks and uses fast storage to stage writes and hold read copies."
      },
      {
        "title": "Share and back up",
        "body": "Publish storage over SMB, NFS and iSCSI. Schedule backups and watch their progress and throughput, or cancel them."
      },
      {
        "title": "Applications beside the storage",
        "body": "Install Aimee, llama.cpp, vLLM, GitHub Actions runners and the Wolf game-streaming server as plugins. Each plugin states its own GPU and runtime requirements."
      },
      {
        "title": "Health and power management",
        "body": "Check SMART health, alerts and disk activity, and benchmark disks with fio. Spin down idle disks and stage writes on fast media."
      },
      {
        "title": "Debian installation and updates",
        "body": "Install from a SmoothISO image, with the operating system on mirrored disks if you want it. Updates arrive as Debian packages. The interface is in English and Dutch."
      }
    ],
    "sections": [
      {
        "title": "Policy above familiar tools",
        "body": [
          "SmoothNAS decides where data goes and leaves the storage itself to tools you already know. mdadm, LVM and ZFS stay separate tools, so their usual recovery procedures still apply.",
          "SmoothFS supplies tiering and caching, and nonraid supplies parity. Both are separate projects that SmoothNAS integrates. Moving a live iSCSI LUN between SmoothFS tiers is opt-in; check the support matrix before enabling it."
        ]
      },
      {
        "title": "An appliance that can run more than storage",
        "body": [
          "Plugins put inference, CI runners and game streaming on the same host as the storage they use. Each plugin has its own releases, profiles and hardware requirements."
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
    "repo": "https://github.com/RakuenSoftware/smoothnas",
    "license": "AGPL-3.0"
  },
  {
    "slug": "smoothrouter",
    "name": "SmoothRouter",
    "group": "systems",
    "tagline": "Debian networking with a browser control plane",
    "summary": "A Debian router you manage from a browser: routing, nftables firewall, DNS, DHCP, PPPoE and outbound VPN, on hardware you choose. LAN clients can use a regular gateway or a VPN gateway. The source is private, and access is by opt-in arrangement.",
    "features": [
      {
        "title": "Firewall and NAT",
        "body": "Set nftables policy in the browser, then read the rules it produced from a shell."
      },
      {
        "title": "DNS, DHCP and filtering",
        "body": "dnsmasq handles name resolution and leases. Resolver blocklists filter the whole network."
      },
      {
        "title": "PPPoE uplinks",
        "body": "Connect to providers that need a PPPoE session, configured alongside the rest of the network."
      },
      {
        "title": "Reusable VPN profiles",
        "body": "Define an outbound OpenVPN connection once, separately from the LAN gateways that use it."
      },
      {
        "title": "Selectable LAN VPN gateways",
        "body": "Each gateway has its own address, so a client chooses regular internet or a VPN by choosing its gateway. VPN gateways carry IPv4 only, and stop forwarding when their tunnel is down rather than falling back to the regular uplink."
      },
      {
        "title": "Offline installation",
        "body": "The installer carries its packages and asks which interface and address serve the LAN, instead of assuming a port. No internet connection is needed."
      }
    ],
    "sections": [],
    "related": [
      "smoothiso",
      "smoothkernel",
      "smoothgui",
      "smoothapt"
    ],
    "resources": [],
    "status": "Limited opt-in",
    "sourcePolicy": "We publish the source of everything else we build. SmoothRouter faces the internet and guards everything behind it. Publishing its source changes the security calculation for every network that runs it, and given recent privacy and security concerns we are not convinced a public release is wise. The source is private for now, and it may never be released. Access is by opt-in arrangement, and its repository and package archive require authorization."
  },
  {
    "slug": "ouroboros-ring",
    "name": "ouroboros-ring",
    "group": "libraries",
    "tagline": "Shared-memory messaging between processes on one host",
    "summary": "A message transport for programs on the same Linux host. One C host owns the shared memory and admits clients. Clients in C, Go and Rust exchange typed events through it under one versioned specification. Aimee uses it, and it is released separately.",
    "features": [
      {
        "title": "One host, private queues",
        "body": "The host owns the memory and decides who attaches. Each client gets its own pair of queues and shares one payload area with the others."
      },
      {
        "title": "C, Go and Rust",
        "body": "A C11 host and client, a Go client without cgo, and a Rust client with a module runtime. Only the C library implements the host."
      },
      {
        "title": "A specification you can implement",
        "body": "The specification and frozen layout vectors define the wire format, memory layout and module protocol, independent of any one language."
      },
      {
        "title": "Routing and backpressure",
        "body": "Events are routed by type, and a full queue applies backpressure to its sender."
      },
      {
        "title": "Large payloads and module calls",
        "body": "Large payloads travel through the shared payload area. Processes can call modules in other processes, and the C library adds a pool for concurrent calls."
      },
      {
        "title": "Conformance across languages",
        "body": "Golden vectors, conformance tests against the C host, sanitizer runs and a dispatch performance budget check every implementation against the specification."
      }
    ],
    "sections": [
      {
        "title": "Released on its own",
        "body": [
          "ouroboros-ring started inside Aimee. It now has its own repository, specification, tests and releases, so other programs depend on a release rather than on Aimee's source.",
          "It works only between processes on one POSIX/Linux host. Between machines, use a network protocol."
        ]
      },
      {
        "title": "Choose the implementation that fits",
        "body": [
          "The C library installs with CMake and pkg-config. The Go client is an ordinary module with no cgo. The Rust client is a crate that depends on libc.",
          "Releases and protocol versions are numbered separately. Host and client agree on a wire version when they attach, so read the versioning guide before upgrading either."
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
        "label": "Specification",
        "href": "https://github.com/RakuenSoftware/ouroboros-ring/blob/main/spec/README.md"
      },
      {
        "label": "Architecture",
        "href": "https://github.com/RakuenSoftware/ouroboros-ring/blob/main/docs/architecture.md"
      }
    ],
    "repo": "https://github.com/RakuenSoftware/ouroboros-ring",
    "license": "AGPL-3.0",
    "status": "Early development"
  },
  {
    "slug": "smoothfs",
    "name": "SmoothFS",
    "group": "libraries",
    "tagline": "One namespace, with tiering or caching underneath",
    "summary": "A Linux kernel filesystem that stacks over other filesystems on mixed media. Tier mode moves files between fast and slow tiers. Cache mode keeps every file on the slowest tier and uses fast media to stage writes and hold disposable read copies.",
    "features": [
      {
        "title": "Tier mode",
        "body": "Each file lives on one tier at a time. How often it is used, and the placement policy, decide when it moves up or down."
      },
      {
        "title": "Cache mode",
        "body": "The slowest tier holds every file. The fastest tier stages buffered writes and caches reads, and adds no permanent capacity."
      },
      {
        "title": "Write staging and drain",
        "body": "A staged write counts as required data until it is drained to the base tier. A sync drains staging, and a full cache sends writes straight to the base tier."
      },
      {
        "title": "Protocol integration",
        "body": "NFS, Samba and file-backed iSCSI are supported. Moving an active iSCSI LUN between tiers is opt-in and follows the documented rollout steps."
      },
      {
        "title": "Kernel data path",
        "body": "The kernel module handles file operations. A userspace control plane plans placement, provisions pools and runs recovery over generic netlink."
      },
      {
        "title": "Packaged for Debian",
        "body": "DKMS and native Samba VFS packages target the kernel, architecture and Samba combinations in the support matrix."
      }
    ],
    "sections": [
      {
        "title": "Choose the mode when creating the pool",
        "body": [
          "Tier mode spreads permanent storage across media classes. Cache mode counts only the base tier as capacity, and uses fast media to speed up eligible buffered operations.",
          "A tiered pool cannot be switched to cache mode in place. Consolidate and verify its contents on the base tier first, following the operator runbook."
        ]
      },
      {
        "title": "Use the supported combinations",
        "body": [
          "The support matrix lists the lower filesystems, minimum kernel, Debian architectures and Samba ABI. Check it before deploying or upgrading.",
          "SmoothNAS provisions and manages SmoothFS pools on the appliance. SmoothFS itself is maintained separately, with documented rules for moving and recovering data."
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
    "repo": "https://github.com/RakuenSoftware/smoothfs",
    "license": "GPL-2.0"
  },
  {
    "slug": "nonraid",
    "name": "nonraid",
    "group": "libraries",
    "tagline": "Parity protection with a filesystem on each data disk",
    "summary": "A Go implementation of the Unraid-style layout: each data disk keeps its own filesystem, and one to three parity disks protect them. Data disks can differ in size. SmoothNAS provides the management interface.",
    "features": [
      {
        "title": "A filesystem per data disk",
        "body": "Each data disk has its own filesystem, instead of one filesystem striped across the whole array."
      },
      {
        "title": "One to three parity disks",
        "body": "Choose the protection level. No data disk can be larger than the smallest parity disk."
      },
      {
        "title": "Portable engine and Linux transport",
        "body": "Layout validation, parity and Galois-field arithmetic in portable Go, with a Linux NBD transport."
      }
    ],
    "sections": [
      {
        "title": "A focused storage component",
        "body": [
          "nonraid owns the layout and parity. SmoothNAS owns everything around them: the stored configuration, the API, mounting and the interface.",
          "Parity survives as many disk failures as your layout covers, and no more. Keep backups of data you need to recover."
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
    "summary": "One React library for appliance consoles, installers and public websites. Shared design tokens, themes and components give every Rakuen interface the same controls and the same fixes.",
    "features": [
      {
        "title": "Administration components",
        "body": "App shells, panels, data tables, wizards, drawers, pickers, tabs, toasts and confirmation dialogs for running an appliance."
      },
      {
        "title": "Public-site components",
        "body": "Headers, footers, heroes, sections, feature grids, prose, article cards and calls to action. This site is built from them."
      },
      {
        "title": "Shared themes and tokens",
        "body": "CSS custom properties and typed JavaScript tokens, with shared light and dark theme controls."
      },
      {
        "title": "Authentication UI",
        "body": "Login, password change and an authentication context that products reuse for their sessions."
      },
      {
        "title": "English and Dutch",
        "body": "Built-in translation catalogs that products extend with their own messages."
      },
      {
        "title": "Navigation adapters",
        "body": "Navigation components accept a link component, so each product connects its own router."
      }
    ],
    "sections": [
      {
        "title": "The library behind this site",
        "body": [
          "SmoothGUI began as the SmoothNAS admin interface. It now also builds the SmoothISO installer frontend and the site you are reading.",
          "A fix to accessibility or layout in a shared component reaches every product that uses it."
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
        "label": "Package and exports",
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
    "summary": "Build a bootable appliance installer from product configuration and hooks. SmoothISO owns the installation flow every product shares. Each product supplies its packages, configuration and first-boot behavior.",
    "features": [
      {
        "title": "Configuration and hooks",
        "body": "A product wrapper sets the name, version and build paths. Hooks add packages and configuration without forking the installer."
      },
      {
        "title": "Offline package repository",
        "body": "An offline build embeds the Debian base packages and product dependencies, so installation needs no network connection."
      },
      {
        "title": "Interactive or unattended",
        "body": "Install through a SmoothGUI frontend, or boot an unattended entry that uses preset installation settings."
      },
      {
        "title": "Explicit network policy",
        "body": "A product can turn off installer networking and ask the operator to choose the LAN interface and address."
      },
      {
        "title": "Product kernel support",
        "body": "Stage a product-built kernel, selected modules and firmware into the installation environment."
      },
      {
        "title": "Shared first-boot flow",
        "body": "Every appliance uses the same installer and first-boot scripts, and keeps what is specific to it in its hooks."
      }
    ],
    "sections": [
      {
        "title": "Installers that do not drift apart",
        "body": [
          "SmoothNAS and SmoothRouter build their installers with the same tool. SmoothKernel packages the kernel, and each product keeps its own runtime configuration.",
          "An offline install is a build choice: every package the install needs must be in the image. A build that leaves the installer's browser out of the image downloads it during installation, so it needs a network connection."
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
        "label": "Build options",
        "href": "https://github.com/RakuenSoftware/smoothiso/blob/main/build-iso.sh"
      },
      {
        "label": "Installer script",
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
    "summary": "Builds Debian kernel packages from an unmodified kernel.org source, per-architecture configs and an ordered set of patches. Every Smooth product runs the same kernel and keeps its own behavior in userspace.",
    "features": [
      {
        "title": "amd64 and arm64 configs",
        "body": "One canonical configuration per architecture gives every product the same kernel baseline."
      },
      {
        "title": "Visible patch lanes",
        "body": "CachyOS patches, selected controller and HID changes, and local fixes are kept as separate patch sets in source control."
      },
      {
        "title": "Kernel and OpenZFS packages",
        "body": "Separate recipes produce Debian kernel, header and OpenZFS packages."
      },
      {
        "title": "Low-latency defaults",
        "body": "BORE scheduler support and latency-oriented defaults that still suit headless appliances, with hardware support for HTPC and desktop use."
      },
      {
        "title": "DKMS integration",
        "body": "Headers and templates for separately maintained modules such as SmoothFS, OpenZFS and the optional NVIDIA drivers."
      },
      {
        "title": "Signing guidance",
        "body": "Secure Boot and module-signing documentation that keeps private signing keys out of the repository."
      }
    ],
    "sections": [
      {
        "title": "Shared kernel, product-owned userspace",
        "body": [
          "SmoothKernel owns the configs, patches and build recipes. Services, interfaces, release pipelines and out-of-tree module sources belong to the products that use them.",
          "Most operators get these packages from the Smooth apt archive and never build a kernel."
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
    "summary": "The package archive at updates.rakuensoftware.com. It takes Smooth project releases, verifies them and publishes their Debian packages unchanged, with signed archive metadata for apt.",
    "features": [
      {
        "title": "Public and restricted suites",
        "body": "Public suites carry SmoothKernel and SmoothNAS packages. SmoothRouter has a separate archive that requires authorization."
      },
      {
        "title": "Verify before admission",
        "body": "Public projects must pass a build-provenance attestation check. Private releases must come from the expected Actions uploader, with package digests that match GitHub's record."
      },
      {
        "title": "Preserve upstream artifacts",
        "body": "The archive does not rebuild or re-version packages. It signs its own Release metadata for apt clients."
      }
    ],
    "sections": [
      {
        "title": "From release to appliance",
        "body": [
          "The ingestion service checks each release, downloads its Debian packages and rejects the release if a required check fails. The signed Release metadata gives apt an authenticated index of the archive.",
          "Use the source and keyring configuration in the project guide. Access and transport settings depend on the suite."
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
    "repo": "https://github.com/RakuenSoftware/smoothapt",
    "license": "AGPL-3.0"
  },
  {
    "slug": "smoothnas-plugins",
    "name": "SmoothNAS plugins",
    "group": "platform",
    "tagline": "Inference, automation and streaming beside your storage",
    "summary": "Separately released applications for SmoothNAS: Aimee, llama.cpp, vLLM, GitHub Actions runners and the Wolf game-streaming server. Each comes with runtime and GPU profiles for the hardware it needs.",
    "features": [
      {
        "title": "AI tools and inference",
        "body": "Run Aimee, or serve local models with llama.cpp and vLLM. Which acceleration you get depends on the plugin variant and the host GPU."
      },
      {
        "title": "Self-hosted automation",
        "body": "Run GitHub Actions runners on your own hardware, next to the storage they build from."
      },
      {
        "title": "Game streaming",
        "body": "Wolf, from the Games-on-Whales project, streams games to Moonlight clients. Packages exist for NVIDIA, AMD and Intel GPUs."
      }
    ],
    "sections": [
      {
        "title": "Packages with their own lifecycle",
        "body": [
          "Each plugin repository owns its manifests, images and releases. SmoothNAS installs and configures it, places its storage and applies its runtime profile.",
          "Check each plugin's documentation for hardware requirements, permissions and the hosts it was tested on. A plugin in the catalog is not a promise that every device or runtime combination works."
        ]
      }
    ],
    "related": [
      "smoothnas",
      "aimee"
    ],
    "resources": [
      {
        "label": "Aimee packages",
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

/** The source label for a project card: licensed source is open source; source
 * that is public but carries no license yet is only public. */
export function sourceLabel(product: Product): string {
  return product.license != null ? 'Open source' : 'Public source';
}

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}
