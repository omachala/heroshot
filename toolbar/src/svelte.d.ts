import type { Component } from 'svelte';

declare module '*.svelte' {
  const component: Component;
  export default component;
}
