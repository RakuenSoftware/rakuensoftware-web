---
title: "Introducing Rakuen Software"
date: 2026-07-22
author: Rakuen Software
tags: [announcement]
excerpt: "Why we build Linux appliances that keep the Linux reachable, and what the Smooth* family is made of."
---

Most storage and networking appliances make the same bargain with you: give up
the underlying system, and in exchange the hard parts get easy. It works right
up until the moment you need something the vendor did not anticipate. Then the
abstraction that saved you time becomes the wall you cannot get past.

We build the other thing.

## The tools stay reachable

SmoothNAS drives `mdadm`, `LVM` and `ZFS`. SmoothRouter drives `nftables` and
`dnsmasq`. These are not reimplementations wearing familiar names — they are the
actual tools, configured by the appliance and still there when you SSH in.

The web UI is a convenience, not a cage.

## One family, shared foundations

The products are separate, but they are not independent:

- **SmoothKernel** builds one kernel line as Debian packages. Every flavour
  installs it, so driver coverage and firmware baselines cannot drift apart.
- **SmoothISO** turns any product into a bootable Debian installer. Products
  supply hooks; nobody forks the builder.
- **SmoothGUI** is the component library behind every console, every installer,
  and the site you are reading right now.

Maintaining four kernel pipelines and four installers would guarantee they rot
at different rates. There is one of each instead, and flavour differences stay
in userspace where they belong.

## What is here today

`SmoothNAS`, `SmoothFS`, `nonraid`, `SmoothGUI`, `SmoothISO`, `SmoothKernel`
and `aimee` are public on [GitHub](https://github.com/RakuenSoftware).
`SmoothRouter` is running in production but is not public yet.

More to come.
