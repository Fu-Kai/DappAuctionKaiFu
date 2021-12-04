<template>
  <div class="footer">
    <ul v-for="list in category" class="list">
      <li class="title" style=" margin: 1em;">{{ list.title }}</li>
      <li v-for="item in list.linkList" style="margin-left: 1em">
        <img style="width: 1.2em; top: 1.2em" alt="logo" :src="item.imgSrc" data-v-58acbb4a="">&nbsp;
        <a :href="item.link" target="_blank">{{ item.name }}</a>
      </li>
    </ul>


  </div>

  <a-layout-footer :style="{ textAlign: 'center', backgroundColor: '#222'}">
    <span style="color: rgba(255,255,255,0.62)">
          Blockchain English Auction ©2021 Created by KaiFu
    </span>&#9935;
  </a-layout-footer>
</template>

<script>
import {defineComponent, readonly} from 'vue'
import Modal from "@/components/base/modal";
import CreateForm from "@/components/base/createForm";

export default defineComponent({
  name: 'mFooter',
  setup() {
    let category = readonly([
      {
        title: '技术支持',
        linkList: [

          //{name: 'Vue', link: 'https://cn.vuejs.org/'},
          {
            name: 'Node.js',
            link: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg',
            imgSrc: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg'
          },
          {
            name: 'Vue.js',
            link: 'https://2x.antdv.com/docs/vue/introduce-cn/',
            imgSrc: 'https://v3.cn.vuejs.org/logo.png'
          },
          {
            name: 'Truffle',
            link: 'https://cn.vuejs.org/',
            imgSrc: 'https://www.trufflesuite.com/img/truffle-logomark.svg'
          },
          {
            name: 'IPFS',
            link: '#',
            imgSrc: 'https://docs.ipfs.io/images/ipfs-logo.svg'
          },
          {
            name: 'Solidity',
            link: 'https://cn.vuejs.org/',
            imgSrc: 'https://rinkeby.etherscan.io/images/svg/brands/ethereum.svg?v=1.3'
          }
        ]
      }
    ])
    console.log("cat", category);
    return {category}
  }
})
</script>

<style scoped>
.footer {
  display: flex;
  padding: 0.1em 5%;
  background: #222;
}

.footer .list {
  margin-bottom: -1.7em;
  list-style: none;
  margin-right: 5%;
}

.footer .list li {
  margin-bottom: 0.3em;
}

.footer .list li.title {
  font-size: 18px;
  font-weight: 300;
  color: #fff;
  margin-bottom: 0.5em;
}

.footer .list li a {
  color: #fff;
  font-size: 14px;
}
</style>
