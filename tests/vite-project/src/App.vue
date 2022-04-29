<script setup lang="ts">
import { ref } from 'vue';
import { readAndCompressImage } from "browser-image-resizer";

const images = ref([]);

async function onChange(event) {
  let convertImages = Array.from(event.target.files)
    .map(file => readImageAndConvertToBase64(file))
  images.value = await Promise.all(convertImages)
}

async function readImageAndConvertToBase64(file) {
  let image = await readAndCompressImage(file, { debug: true });
  let base64Image = await convertToBase64(image);
  return base64Image
}

function convertToBase64(imageBlob) {
  return new Promise((resolve) => {
    var reader = new FileReader()
    reader.onload = function() {
      resolve(reader.result)
    }
    reader.readAsDataURL(imageBlob)
  })
}
</script>

<template>
  <div id="app">
    <input type="file" accept="image/*" @change="onChange" multiple />
    <div v-if="images.length > 0">
      <img v-for="(image, index) in images" :key="`img_${index}`" :src="image" alt="compressed-image-output" />
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
