<template>
  <!-- compact: 首页侧栏卡片模式；默认：独立分区模式 -->
  <section :class="compact ? 'side-card' : 'home-section'">
    <h2 v-if="!compact" class="section-title"><span class="section-index">{{ index }}</span>{{ title }}</h2>
    <div v-else class="side-card-title">{{ titleEn || title }}</div>
    <div class="timeline" :class="{ 'timeline-compact': compact }">
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
  index: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
  titleEn: { type: String, default: '' }
})
</script>
