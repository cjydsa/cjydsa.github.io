<template>
  <section class="home-section">
    <h2 class="section-title"><span class="section-index">{{ index }}</span>{{ title }}</h2>
    <div class="timeline">
      <div v-for="(e, i) in items" :key="i" class="timeline-item">
        <div class="timeline-period">{{ e.period }}</div>
        <div class="timeline-org">{{ e.school || e.org }}</div>
        <div class="timeline-role">{{ e.degree || e.role }}</div>
        <ul v-if="e.points && e.points.length" class="timeline-points">
          <li v-for="(p, j) in e.points" :key="j">{{ p }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  index: { type: String, required: true },
  items: { type: Array, default: () => [] }
})
</script>
