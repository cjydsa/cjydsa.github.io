<template>
  <section :class="compact ? 'side-card' : 'home-section'">
    <h2 v-if="!compact" class="section-title"><span class="section-index">{{ index }}</span>技能栈</h2>
    <div v-else class="side-card-title">Tech Stack</div>
    <div class="skills-grid" :class="{ 'skills-compact': compact }">
      <div v-for="g in groups" :key="g.group" class="skill-card">
        <div class="skill-group-name">{{ g.group }}</div>
        <div class="skill-tags">
          <span v-for="it in g.items" :key="it" class="tag">{{ it }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  index: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false }
})
</script>
