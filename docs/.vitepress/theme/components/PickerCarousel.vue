<script setup lang="ts">
import { ref } from 'vue';

const steps = [
  {
    number: 1,
    image: '/demo-screenshots/demo-element-selected.png',
    alt: 'Pick any element on the page',
    label: 'Pick Screenshots Visually',
    desc: 'Visit any URL, select any element',
  },
  {
    number: 2,
    image: '/demo-screenshots/demo-element-with-padding.png',
    alt: 'Drag handles to add padding',
    label: 'Adjust Size',
    desc: 'Drag any handle to add padding around your selection',
  },
  {
    number: 3,
    image: '/demo-screenshots/demo-element-with-mask.png',
    alt: 'Polished screenshot with visual effects',
    label: 'Polish',
    desc: 'Fine-tune with visual effects to make it pop',
  },
];

const currentStep = ref(0);

function goTo(index: number) {
  currentStep.value = index;
}

function next() {
  currentStep.value = (currentStep.value + 1) % steps.length;
}

function prev() {
  currentStep.value = (currentStep.value - 1 + steps.length) % steps.length;
}
</script>

<template>
  <div class="picker-carousel">
    <div class="carousel-container">
      <div class="carousel-image-row">
        <button class="carousel-arrow prev" @click="prev" aria-label="Previous step">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div class="carousel-image">
          <img :src="steps[currentStep].image" :alt="steps[currentStep].alt" />
        </div>

        <button class="carousel-arrow next" @click="next" aria-label="Next step">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div class="carousel-info">
        <div class="carousel-label">{{ steps[currentStep].label }}</div>
        <p class="carousel-desc">{{ steps[currentStep].desc }}</p>
        <div class="carousel-dots">
          <button
            v-for="(step, index) in steps"
            :key="index"
            :class="['dot', { active: currentStep === index }]"
            @click="goTo(index)"
            :aria-label="`Go to step ${index + 1}: ${step.label}`"
          >
            {{ step.number }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-carousel {
  max-width: 900px;
  margin: 0 auto;
}

.carousel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.carousel-image-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.carousel-arrow {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #ffffff !important;
  color: var(--vp-c-text-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.dark .carousel-arrow {
  background: var(--navy-dark) !important;
}

.carousel-arrow:hover {
  background: var(--vp-c-brand-1) !important;
  color: white;
}

.carousel-image {
  flex: 1;
  max-width: 800px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 100px rgba(234, 88, 12, 0.25),
    0 0 200px rgba(251, 146, 60, 0.2),
    0 0 350px rgba(251, 146, 60, 0.12);
}

.carousel-image img {
  width: 100%;
  height: auto;
  display: block;
}

.carousel-info {
  margin-top: 24px;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 640px;
  text-align: center;
}

.dark .carousel-info {
  background: var(--navy-dark);
}

.carousel-label {
  font-size: 20px;
  font-weight: 600;
  color: var(--navy-base);
  margin-bottom: 8px;
}

.carousel-desc {
  font-size: 16px;
  color: var(--vp-c-text-2);
  margin: 0;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.dot {
  width: 36px;
  height: 36px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dot:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.dot.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

@media (max-width: 768px) {
  .carousel-arrow {
    width: 40px;
    height: 40px;
  }

  .carousel-arrow svg {
    width: 20px;
    height: 20px;
  }

  .step-badge {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .carousel-label {
    font-size: 20px;
  }

  .carousel-desc {
    font-size: 14px;
  }
}
</style>
