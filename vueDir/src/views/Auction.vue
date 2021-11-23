<template>
  <div>
    <a-back-top/>
  </div>
  <div>
    <a-card
        class="ant-card-shadow"
        :loading="state.loading"
        :tab-list="tabList"
        :active-tab-key="key"
        @tabChange="onTabChange"
    >
      <template #title>
        <h3>
          {{ state.data.title }}
          <span style="float:right">
            <span style="float:left">
              <a-statistic :value="'当前最高出价 ' + state.data.highestBid"
                           v-if="state.data.highestBid != 0 && !state.data.endFlg">
                <template #suffix>
              ETH&emsp;
                </template>
              </a-statistic>
              <a-statistic :value="'成交价 ' + state.data.highestBid" v-else-if="state.data.endFlg">
                <template #suffix>
              ETH&emsp;
                </template>
              </a-statistic>
            </span>
            <a-button type="danger"
                      v-if="new Date(state.data.endTime * 1000) > new Date() && state.data.endFlg == false && account !== state.data.beneficiary"
                      @click="openModal">我要出价</a-button>
            <a-tooltip placement="topRight" title="将收取少量Gas费">
              <a-button type="primary"
                        style="
                               background-color: #fea800;
                               border-color: #fea800;"
                        v-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid !== 0 && state.data.highestBidder === account && !state.data.endFlg"
                        @click="SetAuctionEnd">确认收货
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight" title="将收取少量Gas费">
                      <a-button type="danger"
                                v-if="state.data.bond != 0  && account == state.data.beneficiary && new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid == 0"
                                @click="WithdrawBond">退还保证金</a-button>
              </a-tooltip>
          </span>
        </h3>
      </template>
      <a-descriptions bordered v-if="key==='info'">
        <a-descriptions-item label="商品标题" :span="2">
          {{ state.data.title }}
        </a-descriptions-item>
        <a-descriptions-item label="拍卖发起人" :span="2">
          {{ state.data.beneficiary }}
          <a-tag color="blue" v-if="state.data.beneficiary === account">我</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="截止日期" :span="2">
          {{ new Date(state.data.endTime * 1000).toLocaleString() }}
        </a-descriptions-item>
        <a-descriptions-item label="当前状态">
          <a-tag color="success" v-if="state.data.endFlg === true">
            <template #icon>
              <check-circle-outlined/>
            </template>
            拍卖成功
          </a-tag>
          <a-tag color="error"
                 v-else-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid == 0 && state.data.bond != 0">
            <template #icon>
              <close-circle-outlined/>
            </template>
            无人出价，可退保证金
          </a-tag>
          <a-tag color="orange"
                 v-else-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid == 0 && state.data.bond == 0">
            <template #icon>
              <close-circle-outlined/>
            </template>
            无人出价，已退保证金
          </a-tag>
          <a-tag color="pink"
                 v-else-if="new Date(state.data.endTime * 1000) > new Date() && state.data.highestBid == 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            暂无出价！
          </a-tag>
          <a-tag color="processing"
                 v-else-if="new Date(state.data.endTime * 1000) > new Date() && state.data.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            正在拍卖...
          </a-tag>
          <a-tag color="cyan"
                 v-else-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            卖家发货中
          </a-tag>
          <a-tag color="error" v-else>
            <template #icon>
              <close-circle-outlined/>
            </template>
            拍卖失败
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="起拍金额" :span="2">
          <a-statistic :value="state.data.amountStart">
            <template #suffix>
              ETH
            </template>
          </a-statistic>
        </a-descriptions-item>
        <a-descriptions-item label="胜出者">
          <a-tag style="margin-top:0.7em;float: left" color="blue"
                 v-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBidder === account">我
          </a-tag>
          <a-statistic :value="state.data.highestBidder"
                       v-if="new Date(state.data.endTime * 1000) < new Date() && state.data.highestBid != 0">
          </a-statistic>
        </a-descriptions-item>
        <!--        <a-descriptions-item label="时间进度">-->
        <!--          <a-progress type="circle" :percent="state.data.success ? 100 : state.data.amount * 100 / state.data.goal"-->
        <!--                      :width="80"/>-->
        <!--        </a-descriptions-item>-->
        <a-descriptions-item label="商品介绍">
          {{ state.data.info }}
        </a-descriptions-item>
      </a-descriptions>

      <!--      <Use v-if="key==='use'" :id="id" :data="state.data" :amount="state.data.highestBid"></Use>-->
    </a-card>

    <Modal v-model:visible="isOpen">
      <a-card style="width: 600px; margin: 0 2em;" :body-style="{ overflowY: 'auto', maxHeight: '600px' }">
        <template #title><h3 style="text-align: center">出价</h3></template>
        <create-form :model="model" :form="form" :fields="fields"/>
      </a-card>
    </Modal>
  </div>
  <a-divider v-if="state.data.highestBid != 0">竞拍历史</a-divider>
  <div>
    <!--    <a-card class="ant-card-shadow" :bordered="false">-->
    <div>
      <a-timeline mode="alternate" :reverse="true">
        <a-timeline-item v-for="h in history.data">
          <p>{{ new Date(h.bidTime * 1000).toLocaleString() }}</p>
          <p>竞拍人：{{ h.addr }}&nbsp;<a-tag color="blue" v-if="h.addr === account">我</a-tag>
          </p>
          <p>出价：{{ h.bidAmount }}&nbsp;ETH</p>
        </a-timeline-item>
      </a-timeline>
    </div>
    <!--    </a-card>-->
  </div>
</template>
<script lang="ts">
import {defineComponent, ref, reactive, computed} from 'vue';
import {
  getOneAuction,
  getOneAuctionAllBidInfo,
  Auction,
  Bidder,
  getAccount,
  bid,
  addListener,
  setAuctionEnd,
  withdrawBond,
  getThisAuctionHighestBid
} from '@/api/contract'
import {useRoute} from 'vue-router'
import {message, Empty} from 'ant-design-vue';
import {Icon} from 'ant-design-vue';
import {CheckCircleOutlined, SyncOutlined, CloseCircleOutlined} from '@ant-design/icons-vue'
import Modal from '../components/base/modal.vue'
import CreateForm from '../components/base/createForm.vue'
import {Model, Fields, Form} from '@/type/form'

const column = [
  {
    dataIndex: ''
  }
]

const tabList = [
  {
    key: 'info',
    tab: '商品介绍',
  }
  // {
  //   key: 'use',
  //   tab: '使用请求',
  // },
];

export default defineComponent({
  name: 'Auction',
  components: {Modal, CreateForm, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined},
  setup() {
    // =========基本数据==========
    const route = useRoute();
    const id = parseInt(route.params.id as string);
    const account = ref('');
    // =========商品表格==========
    const state = reactive<{ data: Auction[] | {}, loading: boolean }>({
      data: {},
      loading: true,
    })
    // =========竞拍历史==========
    const history = reactive<{ data: Bidder[] | {}, loading: boolean }>({
      data: {},
      loading: true,
    })
    // ===========出价表单============
    const isOpen = ref(false);

    function openModal() {
      isOpen.value = true
    }

    function closeModal() {
      isOpen.value = false
    }

    const model = reactive<Model>({
      value: 1
    })
    const fields = reactive<Fields>({
      value: {
        type: 'number',
        min: 1,
        label: '出价金额'
      }
    })
    const form = reactive<Form>({
      submitHint: '出价',
      cancelHint: '取消',
      cancel: () => {
        closeModal();
      },
      finish: async () => {
        try {
          await bid(id, model.value);
          message.success('出价成功')
          await fetchData();
          closeModal();
        } catch (e) {
          message.error('出价失败')
        }
      }
    })

    // =========确认收货===========
    async function SetAuctionEnd() {
      try {
        await setAuctionEnd(id);
        message.success('确认收货成功')
        await fetchData();
        closeModal();
      } catch (e) {
        message.error('确认收货失败')
      }
    }

    // =========退保证金===========
    async function WithdrawBond() {
      try {
        await withdrawBond(id);
        message.success('保证金已退回，请查收')
        await fetchData();
        closeModal();
      } catch (e) {
        message.error('保证金退回失败')
      }
    }

    // =========切换标签页===========
    const key = ref('info');
    const onTabChange = (k: 'use' | 'info') => {
      key.value = k;
    }

    // =========加载数据===========
    async function fetchData() {

      //加载商品表格
      state.loading = true;
      try {
        [state.data] = await Promise.all([getOneAuction(id)]);
        console.log("state", state.data);
        state.loading = false;

        //@ts-ignore
        // fields.value.max = state.data.goal - state.data.amount;
      } catch (e) {
        console.log(e);
        message.error('获取详情失败');
      }

      //加载竞拍历史
      history.loading = true;
      try {
        [history.data] = await Promise.all([getOneAuctionAllBidInfo(id)]);
        console.log("history", history.data);
        history.loading = false;
        //@ts-ignore
        // fields.value.max = state.data.goal - state.data.amount;
      } catch (e) {
        console.log("asdfasdf" + e);
        message.error('获取历史失败');
      }
    }


    addListener(fetchData)

    getAccount().then(res => account.value = res)
    fetchData();

    return {
      state,
      history,
      account,
      isOpen,
      openModal,
      form,
      model,
      fields,
      tabList,
      key,
      onTabChange,
      id,
      SetAuctionEnd,
      WithdrawBond
    }
  }
});
</script>
