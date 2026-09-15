<template>
  <section class="home-section">
    <h2 class="section-title"><span class="section-index">{{ index }}</span>技能栈</h2>
    <div class="skills-grid">
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
  index: { type: String, required: true },
  groups: { type: Array, default: () => [] }
})
</script>
