<template>

  <div>
    <a-back-top/>
  </div>
  <div>
    <a-card class="ant-card-shadow"
            style="margin-top: 1em;"
            :tab-list="tabListNoTitle"
            :active-tab-key="noTitleKey"
            @tabChange="key => onTabChange(key, 'noTitleKey')">
      <a-table :columns="columns"
               :loading="state.loading"
               :data-source="state.bid"
               v-if="noTitleKey === 'Auctioned'">
        <template #time="{text, record}">
          {{ new Date(text * 1000).toLocaleString() }}
        </template>
        <template #tag="{text, record}">
          <a-tag color="success" v-if="record.endFlg === true" class="tagValue">
            <template #icon>
              <check-circle-outlined/>
            </template>
            拍卖成功
          </a-tag>
          <a-tag class="tagValue" color="error"
                 v-else-if="new Date(record.endTime * 1000) < new Date() && record.highestBid == 0">
            <template #icon>
              <close-circle-outlined/>
            </template>
            已结束，无人出价
          </a-tag>
          <a-tag class="tagValue" color="pink"
                 v-else-if="new Date(record.endTime * 1000) > new Date() && record.highestBid == 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            暂无出价！
          </a-tag>
          <a-tag class="tagValue" color="processing"
                 v-else-if="new Date(record.endTime * 1000) > new Date() && record.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            正在拍卖...
          </a-tag>
          <a-tag class="tagValue" color="cyan"
                 v-else-if="new Date(record.endTime * 1000) < new Date() && record.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            卖家发货中
          </a-tag>
          <a-tag class="tagValue" color="error" v-else>
            <template #icon>
              <close-circle-outlined/>
            </template>
            拍卖结束
          </a-tag>
        </template>
        <template #action="{text, record}">
          <a @click="clickAuction(record.index)">查看详情</a>
        </template>
      </a-table>
      <a-table :columns="columnsBene"
               :loading="state.loading"
               :data-source="state.bene"
               v-if="noTitleKey === 'Bene'">
        <template #time="{text, record}">
          {{ new Date(text * 1000).toLocaleString() }}
        </template>
        <template #tag="{text, record}">
          <a-tag color="success" v-if="record.endFlg === true">
            <template #icon>
              <check-circle-outlined/>
            </template>
            拍卖成功
          </a-tag>
          <a-tag class="tagValue" color="error"
                 v-else-if="new Date(record.endTime * 1000) < new Date() && record.highestBid == 0 && record.bond != 0">
            <template #icon>
              <InfoCircleOutlined/>
            </template>
            点击右侧详情退保证金
          </a-tag>
          <a-tag class="tagValue" color="orange"
                 v-else-if="new Date(record.endTime * 1000) < new Date() && record.highestBid == 0 && record.bond == 0">
            <template #icon>
              <check-circle-outlined/>
            </template>
            无人出价，已退保证金
          </a-tag>
          <a-tag class="tagValue" color="pink"
                 v-else-if="new Date(record.endTime * 1000) > new Date() && record.highestBid == 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            暂无出价！
          </a-tag>
          <a-tag class="tagValue" color="processing"
                 v-else-if="new Date(record.endTime * 1000) > new Date() && record.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            正在拍卖...
          </a-tag>
          <a-tag class="tagValue" color="cyan"
                 v-else-if="new Date(record.endTime * 1000) < new Date() && record.highestBid != 0">
            <template #icon>
              <sync-outlined :spin="true"/>
            </template>
            卖家发货中
          </a-tag>
          <a-tag class="tagValue" color="error" v-else>
            <template #icon>
              <close-circle-outlined/>
            </template>
            拍卖结束
          </a-tag>
        </template>
        <template #action="{text, record}">
          <a @click="clickAuction(record.index)">查看详情</a>
        </template>
      </a-table>
      <a-table :columns="columnsPurchase"
               :loading="state.loading"
               :data-source="state.purchase"
               v-if="noTitleKey === 'Purchased'">
        <template #time="{text, record}">
          {{ new Date(text * 1000).toLocaleString() }}
        </template>
        <template #tag="{text, record}">
          <a-tag color="success" v-if="record.highestBidder === account" class="tagValue">
            <template #icon>
              <check-circle-outlined/>
            </template>
            买入
          </a-tag>
          <a-tag color="purple" v-if="record.beneficiary === account" class="tagValue">
            卖出
            <template #icon>
              <ArrowRightOutlined/>
            </template>
          </a-tag>
        </template>
        <template #action="{text, record}">
          <a @click="clickAuction(record.index)">查看详情</a>
        </template>
      </a-table>
    </a-card>
    <a-divider></a-divider>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, reactive} from 'vue';
import Modal from '../components/base/modal.vue'
import CreateForm from '../components/base/createForm.vue'
import {Model, Fields, Form} from '@/type/form'
import {
  getAccount,
  Auction,
  getMyAuctions,
  addListener
} from '@/api/contract'
import {message} from 'ant-design-vue'
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import {useRouter} from 'vue-router'

const tabListNoTitle = [
  {
    key: 'Auctioned',
    tab: '我拍过的',
  },
  {
    key: 'Bene',
    tab: '我发起的',
  },
  {
    key: 'Purchased',
    tab: '已成交的',
  },
];
const noTitleKey = ref('Auctioned');
const onTabChange = (value: string, type: string) => {
  console.log(value, type);
  if (type === 'noTitleKey') {
    noTitleKey.value = value;
  }
};
const columns = [
  {
    dataIndex: 'title',
    key: 'title',
    title: '拍卖标题',
    align: 'center',
    width: '16%',
  },
  {
    title: '起拍金额 (ETH)',
    align: 'center',
    dataIndex: 'amountStart',
    key: 'amountStart',
  },

  {
    title: '最高出价 (ETH)',
    align: 'center',
    dataIndex: 'highestBid',
    key: 'highestBid',
  },
  {
    title: '我的最高出价(ETH)',
    dataIndex: 'myBidAmount',
    align: 'center',
    key: 'myBidAmount'
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    align: 'center',
    key: 'endTime',
    slots: {customRender: 'time'}
  },
  {
    title: '当前状态',
    dataIndex: ['endFlg', 'highestBid'],
    key: ['endFlg', 'highestBid'],
    align: 'center',
    slots: {customRender: 'tag'}
  },
  {
    title: '详情',
    dataIndex: 'action',
    key: 'action',
    align: 'center',
    slots: {customRender: 'action'}
  },
]
const columnsBene = [
  {
    dataIndex: 'title',
    key: 'title',
    title: '拍卖标题',
    align: 'center',
    width: '18%',

  },
  {
    title: '起拍金额 (ETH)',
    align: 'center',
    dataIndex: 'amountStart',
    key: 'amountStart',
  },
  {
    title: '最高出价 (ETH)',
    align: 'center',
    dataIndex: 'highestBid',
    key: 'highestBid',
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    align: 'center',
    key: 'endTime',
    slots: {customRender: 'time'}
  },
  {
    title: '当前状态',
    dataIndex: 'endFlg',
    key: 'endFlg',
    align: 'center',
    slots: {customRender: 'tag'},
    filters: [
      {
        text: '可退保证金',
        value: '123',
      }
    ],
    onFilter: (value: any, record: { endTime: number, highestBid: number | any[], bond: number; }) => (new Date(record.endTime * 1000) < new Date() && record.highestBid == 0 && record.bond != 0),
  },
  {
    title: '保证金余额',
    dataIndex: 'bond',
    key: 'bond',
    align: 'center',
  },
  {
    title: '详情',
    dataIndex: 'action',
    key: 'action',
    align: 'center',
    slots: {customRender: 'action'}
  },
]
const columnsPurchase = [
  {
    dataIndex: 'title',
    key: 'title',
    title: '拍卖标题',
    align: 'center',
    width: '20%',
  },
  {
    title: '最终成交出价 (ETH)',
    align: 'center',
    dataIndex: 'highestBid',
    key: 'highestBid',
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    align: 'center',
    key: 'endTime',
    slots: {customRender: 'time'}
  },
  {
    title: '类型',
    dataIndex: ['endFlg', 'highestBid'],
    key: ['endFlg', 'highestBid'],
    align: 'center',
    slots: {customRender: 'tag'}
  },
  {
    title: '详情',
    dataIndex: 'action',
    key: 'action',
    align: 'center',
    slots: {customRender: 'action'}
  },
]

export default defineComponent({
  name: 'Myself',
  components: {
    Modal,
    CreateForm,
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ArrowRightOutlined,
    InfoCircleOutlined
  },
  setup() {
    const account = ref('');
    const isOpen = ref<boolean>(false);
    const state = reactive<{ loading: boolean, bene: Auction[], purchase: Auction[], bid: Auction[] }>({
      loading: true,
      bene: [],
      purchase: [],
      bid: []
    })
    async function fetchData() {
      state.loading = true;
      try {
        const res = await getMyAuctions();
        console.log(res)
        state.bene = res.bene
        state.purchase = res.purchase
        state.bid = res.bid
        state.loading = false;
      } catch (e) {
        console.log(e);
        message.error('获取拍卖失败!');
      }
    }

    const router = useRouter();
    const clickAuction = (index: number) => {
      router.push(`/Auction/${index}`)
    }
    getAccount().then(res => account.value = res);
    addListener(fetchData);
    fetchData();

    return {
      state,
      columns,
      columnsPurchase,
      columnsBene,
      tabListNoTitle,
      noTitleKey,
      onTabChange,
      clickAuction,
      account
    }
  }
});
</script>
