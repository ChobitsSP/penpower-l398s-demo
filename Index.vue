<template>
  <div>
    <el-button :loading="loading"
               v-if="!isPolling"
               type="primary"
               @click="initDevice">连接设备</el-button>
    <el-button :loading="loading"
               v-if="isPolling"
               type="danger"
               @click="clearImage">清空写字板</el-button>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
  import * as PPSignUtils from './Index.ts';

  export default {
    data() {
      return {
        base64: '',
        loading: false,
        isPolling: false
      }
    },
    mounted() {
      const status$ = PPSignUtils.GetStatusSource(this);
      const img$ = PPSignUtils.GetImgSource(status$);
      this.$subscribeTo(img$, this.drawImage);
      this.$subscribeTo(status$.filter(t => t === 0), this.clearImage);
      this.initDevice();
    },
    methods: {
      async initDevice() {
        this.loading = true;
        await PPSignUtils.initDevice(this);
        this.loading = false;
      },
      async uninitDevice() {
        this.loading = true;
        await PPSignUtils.uninitDevice();
        this.clearImage();
        this.loading = false;
      },
      async drawImage(base64) {
        const img = await PPSignUtils.GetImg(base64);
        // this.base64 = img.src;
        const canvas = this.$refs.canvas;
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      },
      async clearImage() {
        await PPSignUtils.DoGet("Clear");
        const canvas = this.$refs.canvas;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    beforeDestroy() {
      this.isPolling = false;
    }
  }
</script>
