<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import CustomHero from './components/CustomHero.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-features-before>
      <CustomHero />
    </template>
  </Layout>
</template>
