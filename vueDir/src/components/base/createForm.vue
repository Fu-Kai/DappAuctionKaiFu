<template>
  <a-form
      :model="model"
      :rules="rules"
      :layout="layout"
      @finish="finish"
      v-bind="itemLayout"
  >
    <a-form-item
        v-for="(field, name) in fields"
        :label="field.label"
        :key="field.label"
        :name="name"
    >
      <a-input
          v-if="field.type === 'input'"
          v-model:value="model[name]"
          :disabled="field.disabled"
      />
      <a-input-password
          v-if="field.type === 'password'"
          v-model:value="model[name]"
          :disabled="field.disabled"
      />
      <a-radio-group v-model:value="model[name]"
                     v-if="field.label === '是否全新'"
                     style="margin-left: 0.25em"
      >
        <a-radio :value="0">全新</a-radio>
        <a-radio :value="1">二手</a-radio>
      </a-radio-group>
      <a-input-number
          v-if="field.type === 'number' && field.label === '出价金额'"
          v-model:value="model[name]"
          :min="field.min"
          :max="field.max"
          style="width: 240px;"
          :disabled="field.disabled"
          :formatter="value => `Eth ${value}`"
          :parser="value => value.replace(/Eth|\s/g, '')"
      />
      <a-input-number
          @change="inputFunc"
          v-if="field.type === 'number' && field.label === '起拍金额'"
          v-model:value="model[name]"
          :min="field.min"
          :max="field.max"
          style="width: 240px;"
          :disabled="field.disabled"
          :formatter="value => `ETH ${value}`"
          :parser="value => value.replace(/ETH|\s/g, '')"
      />
      <a-input-number
          @change="inputFunc2"
          v-if="field.label === '是否抵扣'"
          v-model:value="model[name]"
          :min="field.min"
          :max="field.max"
          style="width: 140px;"
          :disabled="value===2"
          :formatter="value => `KFAC ${value}`"
          :parser="value => value.replace(/KFAC|\s/g, '')"
      />
      <a-button
          type="primary"
          v-if="value === 1 && field.label === '是否抵扣'"
          style="margin-top: 0.25em;margin-left: 0.25em;"
          @click="deduct"
      >
        授权
      </a-button>
      <a-radio-group v-model:value="value"
                     v-if="field.label === '是否抵扣'"
                     style="margin-left: 0.25em"
                     @change="radioChange"
      >
        <a-radio :value="1">是</a-radio>
        <a-radio :value="2">否</a-radio>
      </a-radio-group>

      <a-textarea
          v-if="field.type === 'textarea'"
          v-model:value="model[name]"
          :disabled="field.disabled"
          autoSize
      />
      <a-radio-group
          v-if="field.type === 'radio'"
          v-model:value="model[name]"
          :disabled="field.disabled"
      >
        <a-radio v-for="radio in field.radios" :value="radio.value">
          {{ radio.hint }}
        </a-radio>
      </a-radio-group>
      <a-select
          v-if="field.type === 'select'"
          v-model:value="model[name]"
          :disabled="field.disabled"
      >
        <a-select-option v-for="item in field.select" :value="item">{{
            item
          }}
        </a-select-option>
      </a-select>
      <a-date-picker
          show-time
          placeholder="选择时间"
          v-if="field.type === 'time'"
          v-model:value="model[name]"
      />
      <slot
          v-if="field.customRender"
          :name="field.customRender.slot"
          :field="field"
      >
      </slot>

      <a-upload :file-list="fileList"
                :remove="handleRemove"
                :before-upload="beforeUpload"
                v-if="field.type === 'upload'"
      >

        <a-tooltip placement="topRight" title="因国内访问IPFS网络较慢，暂只支持上传一张图片">
          <a-button>
            <upload-outlined></upload-outlined>
            选择文件
          </a-button>
          <span v-if="field.label === '上传新图'" style="font-size: 12px"> 若不上传，将默认使用旧图发布</span>
        </a-tooltip>
      </a-upload>

      <span
          v-if="field.label === '还需缴保证金'"
          id="bond"
      >
      </span>
      <span id="old" hidden>
      </span>
    </a-form-item>
    <a-form-item :wrapper-col="form.layout === 'inline' ? {} : { offset: 4 }">

      <a-button
          type="primary"
          html-type="submit"
          :loading="submitLoading"
          :disabled="nowFileUploadingCnt !== 0 || form.canSubmit === false"
      >
        {{ form.submitHint || '提交' }}
      </a-button>

      <a-divider type="vertical"/>
      <a-button type="default" @click="form.cancel" v-if="form.cancel">{{
          form.cancelHint || '取消'
        }}
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script lang="ts">
import {reactive, ref} from 'vue'
import {UploadOutlined} from '@ant-design/icons-vue'
import {message} from 'ant-design-vue'
import {approve, BufferToUint8, getAccount, uploadToIpfs} from "@/api/contract";

export default {
  name: 'CreateForm',
  components: {UploadOutlined},
  props: {
    model: Object,
    fields: Object,
    form: Object,
  },
//@ts-ignore
  setup(props) {

    // 生成规则和文件以及自动补全等需要的函数
    const rules = reactive({})
    const nowFileUploadingCnt = ref(0)
    const CopyFields = reactive({})

    for (let x in props.fields) {
      let field = props.fields[x]
      //@ts-ignore
      CopyFields[x] = {}
      // 如果有规则
      if (field.rule) {
        //@ts-ignore
        rules[x] = props.fields[x].rule
        //@ts-ignore
        if (rules[x].required && !rules[x].validator)
            //@ts-ignore
          rules[x].message = `${field.label}不能为空!`
      }
    }
    // 提交函数
    const submitLoading = ref(false)
    const finish = async () => {
      submitLoading.value = true
      try {
        await props.form.finish()
      } catch (e) {
      } finally {
        submitLoading.value = false
      }
    }

    // 布局
    const layout = ref(props.form.layout || 'horizontal')
    const itemLayout = ref(
        layout.value === 'horizontal'
            ? {labelCol: {span: 4}, wrapperCol: {span: 20}}
            : {}
    )
    const value = ref(2);
    const value2 = ref(0);

    function radioChange() {
      console.log(value);
    }

    //@ts-ignore
    function inputFunc(e) {
      console.log(e)
      //@ts-ignore
      document.getElementById("bond").innerHTML = 2 * e;
      //@ts-ignore
      document.getElementById("old").innerHTML = 2 * e;
    }

    //@ts-ignore
    function inputFunc2(e) {
      //@ts-ignore
      let old = document.getElementById("old").innerHTML;
      //@ts-ignore
      if (old - e < 0) {
        //@ts-ignore
        document.getElementById("bond").innerHTML = '抵扣金额不能超过起拍金额的两倍,请重新选择'
      } else
          //@ts-ignore
        document.getElementById("bond").innerHTML = old - e;
    }

    async function deduct() {
      try {
        //@ts-ignore
        let deduction = document.getElementById("bond").innerHTML;
        //@ts-ignore
        await approve(await getAccount(), 999);
        message.success('委托成功');
      } catch (e) {
        console.log(e)
        message.error('委托失败');
      }
    }

    async function upload() {
      try {
        let hash = await uploadToIpfs(buffer.value);

        message.success('提交至IPFS成功  哈希值:' + hash);
        props.model.picsHash = hash;
        return (hash);
      } catch (e) {
        console.log(e);
      }
    }

    const fileList = ref<Blob[]>([]);
    const uploading = ref<boolean>(false);
    const buffer = ref<Array<number>>();
    const handleRemove = (file: Blob) => {
      const index = fileList.value.indexOf(file);
      const newFileList = fileList.value.slice();
      newFileList.splice(index, 1);
      fileList.value = newFileList;
    };
    const beforeUpload = (file: Blob) => {

      fileList.value = [file];
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => {
        buffer.value = BufferToUint8(reader.result);
        upload();
        console.log(buffer.value);
      }
      return false;
    };

    return {
      confirm,
      rules,
      finish,
      submitLoading,
      layout,
      itemLayout,
      nowFileUploadingCnt,
      CopyFields,
      value,
      value2,
      radioChange,
      inputFunc,
      inputFunc2,
      deduct,
      upload,
      fileList,
      uploading,
      buffer,
      handleRemove,
      beforeUpload,
    }
  },
}
</script>
