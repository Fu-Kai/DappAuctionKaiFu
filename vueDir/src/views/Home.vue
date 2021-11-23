<template>
  <div>
    <a-back-top/>
  </div>
  <div>
    <a-card class="ant-card-shadow">
      <template #title>
        <h3>
          所有拍卖
          <a-tooltip placement="topRight" title="确认已准备足够的保证金">
            <a-button style="float: right;"
                      @click="openModal"
                      type="danger">发起拍卖
            </a-button>
          </a-tooltip>
        </h3>

      </template>

      <a-table :columns="columns" :loading="state.loading" :data-source="state.data" >
        <template #filterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
          <div style="width:163px;padding: 8px;">
            <a-input
                ref="se archInput"
                :placeholder="`搜索商品`"
                :value="selectedKeys[0]"
                style="width: 150px; margin-bottom: 8px; display: block"
                @change="e => setSelectedKeys(e.target.value ? [e.target.value] : [])"
                @pressEnter="handleSearch(selectedKeys, confirm, column.dataIndex)"
            />
            <a-button
                type="primary"
                size="small"
                style="width: 68px; margin-right: 10px"
                @click="handleSearch(selectedKeys, confirm, column.dataIndex)"
            >
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button size="small" style="width: 68px" @click="handleReset(clearFilters)">
              取消
            </a-button>
          </div>
        </template>
        <template #filterIcon="filtered">
          <search-outlined :style="{ color: filtered ? '#108ee9' : undefined }" />
        </template>
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
            已结束
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
    </a-card>

    <Modal v-model:visible="isOpen">
      <a-card style="width: 600px; margin: 0 2em;" :body-style="{ overflowY: 'auto', maxHeight: '600px' }">
        <template #title>
          <h3 style="text-align: center">发起拍卖</h3>
          <h5 style="text-align: center; color: red">需支付的保证金为 <span style="color: cornflowerblue">起拍金额</span>
            的两倍,拍卖结束后退回</h5>
        </template>
        <a-icon type="ant-design"/>
        <create-form :model="model" :form="form" :fields="fields"/>

      </a-card>
    </Modal>
  </div>


</template>

<script lang="ts">
import {defineComponent, ref, reactive, watch, toRefs} from 'vue';
import Modal from '../components/base/modal.vue'
import CreateForm from '../components/base/createForm.vue'
import {Model, Fields, Form} from '@/type/form'
import {
  contract,
  getAccount,
  getAllAuctions,
  Auction,
  newAuctionStart,
  addListener
} from '@/api/contract'
import {message} from 'ant-design-vue'
import {CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,SearchOutlined} from '@ant-design/icons-vue'
import {useRouter} from 'vue-router'
import _default from "ant-design-vue/es/color-picker";





export default defineComponent({

  name: 'Home',
  components: {Modal, CreateForm, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,SearchOutlined},
  setup() {
    const searchState = reactive({
      searchText: '',
      searchedColumn: '',
    });
    const searchInput = ref();
    const columns = [
      {
        dataIndex: 'title',
        key: 'title',
        title: '商品标题',
        align: 'center',
        width: '20%',
        slots: {
          filterDropdown: 'filterDropdown',
          filterIcon: 'filterIcon',
        },
        onFilter: (value: string, record: { title: { toString: () => string; }; }) =>
            record.title.toString().toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: (visible: any) => {
          if (visible) {
            setTimeout(() => {
              console.log(searchInput.value);
              searchInput.value.focus();
            }, 100);
          }
        },
      },
      {
        title: '起拍金额 (ETH)',
        align: 'center',
        dataIndex: 'amountStart',
        key: 'amountStart',
        sorter: (a: { amountStart: any; }, b: { amountStart: any; }) => {
          return a.amountStart.localeCompare(b.amountStart)
        }
      },
      {
        title: '最高出价 (ETH)',
        align: 'center',
        dataIndex: 'highestBid',
        key: 'highestBid',
        sorter: (a: { highestBid: any; }, b: { highestBid: any; }) => {
          return a.highestBid.localeCompare(b.highestBid)
        }
      },
      {
        title: '结束时间',
        dataIndex: 'endTime',
        align: 'center',
        key: 'endTime',
        sorter: (a: { endTime: any; }, b: { endTime: any; }) => {
          return a.endTime.localeCompare(b.endTime)
        },
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
      }
    ]
    const isOpen = ref<boolean>(false);
    const state = reactive<{ loading: boolean, data: Auction[] }>({
      loading: true,
      data: []
    })

    async function fetchData() {
      state.loading = true;
      try {
        state.data = await getAllAuctions();
        state.loading = false;
      } catch (e) {
        console.log(e);
        message.error('获取拍卖列表失败  请检查区块链网络！');
      }
    }

    async function openModal() {
      model.account = await getAccount();
      isOpen.value = true;
    }

    function closeModal() {
      isOpen.value = false;
    }

    const model = reactive<Model>({
      account: '',
      title: '',
      info: '',
      amountStart: 0,
      date: null,
    })

    const fields = reactive<Fields>({
      account: {
        type: 'input',
        label: '发起人',
        disabled: true
      },
      title: {
        type: 'input',
        label: '商品名称',
        rule: {
          required: true,
          trigger: 'blur'
        }
      },
      info: {
        type: 'textarea',
        label: '商品简介',
        rule: {
          required: true,
          trigger: 'blur'
        }
      },
      amountStart: {
        type: 'number',
        label: '起拍金额',
        min: 0.01
      },
      date: {
        type: 'time',
        label: '截止日期',
      },
    })
    watch(() => state.data, async () => {
      console.log('变化')

    },{
      deep: true,
      immediate:true
    });

    const form = reactive<Form>({
      submitHint: '发起拍卖',
      cancelHint: '取消',
      cancel: () => {
        closeModal();
      },
      finish: async () => {
        const seconds = Math.ceil(new Date(model.date).getTime() / 1000);
        try {
          const res = await newAuctionStart(model.account, model.title, model.info, model.amountStart, seconds);
          console.log(res)
          message.success('已上架~')
          closeModal();
          await fetchData();
        } catch (e) {
          console.log('弄', e);
          message.error('发起失败，请检查')
        }
      }
    })

    const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
      confirm();
      searchState.searchText = selectedKeys[0];
      searchState.searchedColumn = dataIndex;
    };

    const handleReset = (clearFilters: () => void) => {
      clearFilters();
      searchState.searchText = '';
    };

    const router = useRouter();
    const clickAuction = (index: number) => {
      router.push(`/Auction/${index}`)
    }
    addListener(fetchData)
    fetchData();

    return {
      openModal,
      isOpen,
      model,
      fields,
      form,
      state,
      columns,
      clickAuction,
      handleSearch,
      handleReset,
      searchInput,
      ...toRefs(searchState),
    }
  }
});
</script>

