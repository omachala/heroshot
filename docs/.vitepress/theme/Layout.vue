<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import CustomHero from './components/CustomHero.vue';
import SiteFooter from './components/SiteFooter.vue';

const { Layout } = DefaultTheme;
const { frontmatter } = useData();
</script>

<template>
  <Layout>
    <template #home-features-before>
      <CustomHero />
    </template>
    <template #layout-bottom>
      <SiteFooter v-if="frontmatter.layout === 'home' || !frontmatter.layout" />
    </template>
  </Layout>
</template>
