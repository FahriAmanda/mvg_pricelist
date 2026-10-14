<script setup lang="ts">
// PRICE LIST MVG - Mitra Visual Group
useHead({
  title: 'PRICE LIST MVG - Mitra Visual Group',
  meta: [
    {
      name: 'description',
      content: 'Price List resmi Mitra Visual Group (MVG) dengan sinkronisasi harga otomatis Google Sheets, dark/light mode, dan kalkulator kebutuhan penawaran.'
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/mvg-logo.png' }
  ]
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
