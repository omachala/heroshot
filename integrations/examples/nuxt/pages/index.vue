<script setup>
import { Heroshot } from 'heroshot/nuxt';
</script>

<template>
  <main>
    <h1>Heroshot + Nuxt</h1>
    <p>This is a minimal example of heroshot integrated with Nuxt.</p>

    <h2>Screenshot Demo</h2>
    <Heroshot name="Hero" alt="Hero screenshot" />

    <p>Toggle dark mode to see the screenshot switch automatically.</p>
  </main>
</template>
