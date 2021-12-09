<template>
  <header>
    <nav :class="['nav', {'nav-active': scrollTop > 0}]">
      <a class="logo" @click="goHome"><img src="/logo2.png"></a>
      <router-link to="/">拍卖大厅</router-link>
      <router-link to="/myself">我的拍卖</router-link>
      <router-link to="/Goods">展览柜</router-link>
      <span :style="{ flex: 1 }"></span>
      <a @click="handleClick">{{ "当前账户：" + account }}</a>
    </nav>
    <h1 class="title">
      区块链
      <span style=" text-shadow: mediumpurple 0 0 9px;">&#9935;</span>
      英式拍卖
    </h1>

    <a-switch @change="darkSwitch" style="float: right; margin: 60px 30px 0 0;" checked-children="明亮模式"
              un-checked-children="暗黑模式"
              v-model:checked="checked1"/>
    <a-tag color="black" style="float: right; margin: 60px 30px 0 0;"><a @click="GetContractBalance">点击查询合约内总担保资金</a>
    </a-tag>
  </header>
</template>

<script lang="ts">
import {defineComponent, onMounted, reactive, ref, toRefs} from 'vue'
import {useRouter} from 'vue-router'
import {message} from 'ant-design-vue'
import {
  addListener,
  authenticate,
  getAccount,
  getBalance,
  getContractBalance,
  getPersonErcPoints
} from '@/api/contract'

export default defineComponent({

  setup() {
    message.config({
      duration: 1.9,
      maxCount: 3,
    });

    async function GetContractBalance() {
      const balance = await getContractBalance();
      message.success('本站合约内总担保资金：' + balance.toString() + ' ETH');
    }

    const state = reactive({
      checked1: true,
    });
    // 滚动事件
    const scrollTop = ref(0)
    onMounted(() => {
      window.addEventListener('scroll', () => {
        scrollTop.value = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      })
    })

    // 认证
    const account = ref('认证');

    async function handleClick() {
      await authenticate();
      account.value = await getAccount();
      let strHead = account.value[0] + account.value[1] + account.value[2] + account.value[3] + account.value[4];
      let strTail = '...' + account.value[account.value.length - 3] + account.value[account.value.length - 2] + account.value[account.value.length - 1];
      let strOut = strHead + strTail;
      message.success('账户：' + strOut + " | ETH" + ' 余额：' + await getBalance() + ' | KFAC余额：' + await getPersonErcPoints());
    }

    function darkSwitch() {
      message.success('切换');
    }

    const router = useRouter();
    const goHome = () => {
      router.push(`/`)
    }
    handleClick();
    addListener(handleClick)


    return {scrollTop, handleClick, account, ...toRefs(state), darkSwitch, GetContractBalance, goHome}
  }
})
</script>

<style scoped>
header {
  height: 100px;
  /*background: url("/header.png") no-repeat top/cover;*/
  background: #141E30; /* fallback for old browsers */
  background: -webkit-linear-gradient(to right, #243B55, #141E30); /* Chrome 10-25, Safari 5.1-6 */
  background: linear-gradient(to right, #243B55, #141E30); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */


}

header .nav {
  display: flex;
  align-items: center;
  padding: 0 1em;
  position: fixed;
  left: 0;
  right: 0;
  transition: all 0.3s ease;
  z-index: 10;
  border-radius: 0 0 20px 20px;
}

@media screen and (max-width: 800px) {
  header .nav {
    padding: 0;
  }
}

header .nav a {
  line-height: 50px;
  padding: 0 1em;
  border: 3px solid transparent;
  color: white;
  transition: all 0.3s ease;
  border-radius: 1px 1px 20px 20px;
}

header .nav a:hover {
  background: var(--hover-background);
  border-top-color: var(--hover-color);
}

header .nav a.router-link-active, header .nav a.router-link-exact-active {
  border-top-color: var(--choose-color);
}

header .nav a.logo {
  padding: 0;
}

header .nav a.logo img {
  width: 0;
  height: 50px;
  opacity: 0;
  transition: all 0.3s ease;
}

header .nav:hover, header .nav.nav-active {
  background: #fff;
  box-shadow: var(--shadow);
}

header .nav:hover a, header .nav.nav-active a {
  color: #333;
}

header .nav.nav-active a.logo {
  padding: 0 1em;
}

header .nav.nav-active a.logo img {
  width: 50px;
  opacity: 1;
}

.title {
  position: absolute;
  left: 1em;
  top: 1.8em;
  color: white;


}
</style>
