<template>
  <div>
    <a-back-top/>
  </div>
  <a-list :grid="{ gutter: 16, column: 3 }" :data-source="stateGoods.data" :loading="stateGoods.loading">
    <template #renderItem="{ item }" >
      <a-list-item v-if="item.owner == account">
        <a-card :title="item.name" style="font-size: 13px;">
          <template #extra>
            <a-button type="danger" @click="openModal(item)" v-if="item.condition == 0">
              上架
            </a-button>
            <a-button type="danger"  v-else-if="item.condition == 1" disabled>
              拍卖中...
            </a-button>
          </template>
          <img width="399"
               height="250"
               alt="logo"
               :src="'https://ipfs.io/ipfs/'+ item.picsHash"><br><br>
          拥有者&nbsp;：{{ item.owner }}<br>
          品&nbsp;&nbsp;&nbsp;牌 ：{{ item.brand }}
          <a :href="'https://ipfs.io/ipfs/' + item.picsHash" style="float: right" target="_blank">图片IPFS元数据</a>
          <br>
        </a-card>
      </a-list-item>

    </template>
  </a-list>
  <Modal v-model:visible="isOpen">
    <a-card style="width: 600px; margin: 0 2em;" :body-style="{ overflowY: 'auto', maxHeight: '600px' }">
      <template #title>
        <h3 style="text-align: center">重新上架</h3>
        <h5 style="text-align: center; color: red">需支付的保证金为 <span style="color: cornflowerblue">起拍金额</span>
          的两倍,拍卖结束后退回</h5>
        <h5 style="text-align: center; color: black">若你拥有本站
          <span style="color: gold">KFAC</span>
          积分代币
          <a-tooltip placement="topRight" title="当每件物品成功拍卖之后，卖家会获得与成交价的一半等额的KFAC代币" color="blue">
            <QuestionCircleOutlined/>
          </a-tooltip>
          ，你可以用来抵扣等额的保证金（1 KFAC 抵扣 1 ETH)
        </h5>
      </template>
      <a-icon type="ant-design"/>
      <create-form :model="model" :form="form" :fields="fields"/>
    </a-card>
  </Modal>
</template>
<script lang="ts">
import {defineComponent, ref, reactive} from 'vue';
import {
  getAccount,
  Auction,
  getMyAuctions,
  addListener, Good, getAllGood, deductPersonErcPoints, reAuctionStart
} from '@/api/contract'
import {message} from 'ant-design-vue'
import Modal from '../components/base/modal.vue'
import CreateForm from '../components/base/createForm.vue'
import {Fields, Form, Model} from '@/type/form'
import {useRouter} from 'vue-router'
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

// =========商品详情==========
const stateGoods = reactive<{ loading: boolean, data: Good[] }>({
  data: [],
  loading: true,
})
export default defineComponent({
  name: 'Goods',
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
    const isOpen = ref<boolean>(false);

    async function openModal(item: any) {
      model.gid = item.gid;
      model.account = await getAccount();
      model.name = item.name;
      model.used = 1;
      model.brand = item.brand;
      model.picsHash = item.picsHash;
      model.intro = item.intro;
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
      deduction: 0,
      date: null,
      bond: 0,
      brand: '',
      picsHash: '',
      name: '',
      intro: '',
      gid: 0,
    })

    const fields = reactive<Fields>({
      account: {
        type: 'input',
        label: '发起人',
        disabled: true
      },
      title: {
        type: 'input',
        label: '拍卖标题',
        rule: {
          required: true,
          trigger: 'blur'
        }
      },
      info: {
        type: 'input',
        label: '拍卖备注',
      },
      name: {
        disabled: true,
        type: 'input',
        label: '商品名称',
        rule: {

          required: true,
          trigger: 'blur'
        }
      },
      intro: {
        disabled: true,
        type: 'textarea',
        label: '商品简介',
        rule: {
          required: true,
          trigger: 'blur'

        }
      },
      brand: {
        disabled: true,
        type: 'input',
        label: '商品品牌',
        rule: {
          required: true,
          trigger: 'blur'
        }
      },
      amountStart: {
        type: 'number',
        label: '起拍金额',
        min: 1,
      },
      deduction: {
        type: 'number',
        label: '是否抵扣',
        disabled: true,
        min: 0
      },
      date: {
        type: 'time',
        label: '截止日期',
      },
      file: {
        type: 'upload',
        label: '上传新图',
      },
      bond: {
        type: 'number',
        label: '还需缴保证金',
        min: 1
      },
    })
    const form = reactive<Form>({
      submitHint: '发起拍卖',
      cancelHint: '取消',
      cancel: () => {
        closeModal();
      },
      finish: async () => {
        const seconds = Math.ceil(new Date(model.date).getTime() / 1000);
        try {
          console.log(model)
          let _bond = model.amountStart * 2 - model.deduction;
          console.log(model.account, model.title, model.info, model.amountStart, seconds, _bond);
          if (model.deduction != 0) {
            try {
              await deductPersonErcPoints(await getAccount(), model.deduction)
              message.success('扣除' + model.deduction + 'KFAC成功')
            } catch (e) {
              message.error('扣除KFAC失败')
            }
          }
          await reAuctionStart(model.gid, model.account, model.title, model.info, model.amountStart, seconds, _bond, model.picsHash);
          message.success('已加入拍卖~')
          closeModal();
          await fetchData();
        } catch (e) {
          console.log('弄', e);
          message.error('上架失败，请检查')
        }
      }
    })

    const account = ref('');

    //加载商品详情
    async function fetchData() {
      stateGoods.loading = true;
      try {
        stateGoods.data = await getAllGood(await getAccount());
        stateGoods.loading = false;
      } catch (e) {
        console.log(e);
        message.error('获取商品详情失败');
      }
    }

    getAccount().then(res => account.value = res);
    const router = useRouter();
    addListener(fetchData)
    fetchData()
    return {
      openModal,
      isOpen,
      model,
      fields,
      form,
      stateGoods,
      router,
      account,
    }
  }
});
</script>
