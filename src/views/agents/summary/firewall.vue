<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import {
  ElTabs,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElPagination,
  ElMessageBox,
  type FormInstance, // 导入 FormInstance 类型用于表单引用
  type FormRules // 导入 FormRules 类型用于表单规则
} from 'element-plus';

// 活动标签页
const activeTab = ref('port');

// 加载状态
const loading = ref(false);

// 规则列表数据 (添加模拟数据)
const portRules = ref<any[]>([
  { id: 1, protocol: 'TCP', port: '80', sourceIp: '0.0.0.0/0', policy: 'allow' },
  { id: 2, protocol: 'TCP', port: '443', sourceIp: '0.0.0.0/0', policy: 'allow' },
  { id: 3, protocol: 'UDP', port: '53', sourceIp: '192.168.1.100', policy: 'deny' },
]);
const forwardRules = ref<any[]>([
  { id: 101, protocol: 'TCP', sourcePort: '8080', destIp: '192.168.1.200', destPort: '80' },
]);
const ipRules = ref<any[]>([
  { id: 201, sourceIp: '10.0.0.5', policy: 'block' },
  { id: 202, sourceIp: '8.8.8.8', policy: 'allow' },
]);

// 弹窗可见性
const portRuleDialogVisible = ref(false);
const forwardRuleDialogVisible = ref(false);
const ipRuleDialogVisible = ref(false);

// 表单数据模型 (定义属性)
const portRuleForm = reactive({
  id: null, // 用于编辑，创建时为空
  protocol: 'TCP', // 默认值
  port: '',
  sourceIp: '',
  policy: 'allow' // 默认值
});
const forwardRuleForm = reactive({
  id: null,
  protocol: 'TCP',
  sourcePort: '',
  destIp: '',
  destPort: ''
});
const ipRuleForm = reactive({
  id: null,
  sourceIp: '',
  policy: 'allow'
});

// 表单引用
const portRuleFormRef = ref<FormInstance>();
const forwardRuleFormRef = ref<FormInstance>();
const ipRuleFormRef = ref<FormInstance>();

// 表单验证规则
// TODO: 定义具体的验证规则
const portRuleFormRules = reactive<FormRules>({});
const forwardRuleFormRules = reactive<FormRules>({});
const ipRuleFormRules = reactive<FormRules>({});

// 打开创建/编辑弹窗
const openCreateDialog = (type: 'port' | 'forward' | 'ip') => {
  // TODO: 实现编辑逻辑，目前仅处理创建
  // 重置表单状态
  let formToReset: any = {};
  let formRefToClear: FormInstance | undefined;

  if (type === 'port') {
    formToReset = portRuleForm;
    // 设置默认值或清空
    Object.assign(formToReset, { id: null, protocol: 'TCP', port: '', sourceIp: '', policy: 'allow' });
    formRefToClear = portRuleFormRef.value;
    portRuleDialogVisible.value = true;
  } else if (type === 'forward') {
    formToReset = forwardRuleForm;
    Object.assign(formToReset, { id: null, protocol: 'TCP', sourcePort: '', destIp: '', destPort: '' });
    formRefToClear = forwardRuleFormRef.value;
    forwardRuleDialogVisible.value = true;
  } else if (type === 'ip') {
    formToReset = ipRuleForm;
    Object.assign(formToReset, { id: null, sourceIp: '', policy: 'allow' });
    formRefToClear = ipRuleFormRef.value;
    ipRuleDialogVisible.value = true;
  }
  // 确保在 DOM 更新后再清除验证状态, Vue 3 中建议使用 nextTick
  import('vue').then(({ nextTick }) => {
    nextTick(() => {
      formRefToClear?.clearValidate();
    });
  });
};

// 处理删除操作
const handleDelete = async (type: 'port' | 'forward' | 'ip', id: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条规则吗?', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    loading.value = true;
    // --- 模拟 API 调用 ---
    console.log(`模拟删除 ${type} 规则，ID: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟

    if (type === 'port') {
      portRules.value = portRules.value.filter(rule => rule.id !== id);
    } else if (type === 'forward') {
      forwardRules.value = forwardRules.value.filter(rule => rule.id !== id);
    } else if (type === 'ip') {
      ipRules.value = ipRules.value.filter(rule => rule.id !== id);
    }
    // --- 模拟 API 调用结束 ---

    // ElMessage.success('删除成功'); // 提示用户
  } catch (error) {
    // ElMessage.info('取消删除');
    if (error !== 'cancel') {
      console.error(`删除 ${type} 规则失败:`, error);
      // ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 处理表单提交（创建规则）
const handleFormSubmit = async (type: 'port' | 'forward' | 'ip') => {
  let formRef: FormInstance | undefined;
  let formModel: any;
  let rulesList: any[];
  let dialogVisibleRef: any;

  if (type === 'port') {
    formRef = portRuleFormRef.value;
    formModel = portRuleForm;
    rulesList = portRules.value;
    dialogVisibleRef = portRuleDialogVisible;
  } else if (type === 'forward') {
    formRef = forwardRuleFormRef.value;
    formModel = forwardRuleForm;
    rulesList = forwardRules.value;
    dialogVisibleRef = forwardRuleDialogVisible;
  } else { // type === 'ip'
    formRef = ipRuleFormRef.value;
    formModel = ipRuleForm;
    rulesList = ipRules.value;
    dialogVisibleRef = ipRuleDialogVisible;
  }

  if (!formRef) return;

  try {
    const valid = await formRef.validate();
    if (valid) {
      loading.value = true;
      // --- 模拟 API 调用 ---
      const newRule = { ...formModel, id: Date.now() }; // 使用时间戳作为临时 ID
      console.log(`模拟创建 ${type} 规则:`, newRule);
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
      rulesList.push(newRule);
      // --- 模拟 API 调用结束 ---

      dialogVisibleRef.value = false; // 关闭弹窗
      // ElMessage.success('创建成功');
    } else {
      console.log('表单验证失败!');
      return false;
    }
  } catch (error) {
    console.error(`创建 ${type} 规则失败:`, error);
    // ElMessage.error('创建失败');
  } finally {
    loading.value = false;
  }
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  const currentTab = activeTab.value;
  console.log(`获取 ${currentTab} 规则列表...`);

  // --- 模拟 API 调用 ---
  await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
  // 实际场景中，这里会根据 activeTab 发起不同的 API 请求
  // 例如: if (currentTab === 'port') { portRules.value = await api.getPortRules(); }
  // 由于数据已在 ref 中初始化，这里仅模拟加载过程
  // --- 模拟 API 调用结束 ---

  // 确保在 fetchData 完成时 loading 状态被设置回 false
  // 如果在切换 Tab 时上一个请求还没完成，需要处理取消逻辑或确保状态正确
  if (activeTab.value === currentTab) { // 避免旧请求覆盖新请求的状态
      loading.value = false;
  }
  console.log(`${currentTab} 规则列表加载完成 (模拟)`);
};

// 组件挂载时获取初始数据
onMounted(() => {
  fetchData();
});

// 监听 activeTab 变化，切换时重新获取数据
watch(activeTab, (newTab, oldTab) => {
  if (newTab !== oldTab) {
    fetchData(); // 调用 fetchData 加载新标签页的数据
  }
});

</script>

<template>
  <div class="firewall-container p-4">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="端口规则" name="port">
        <div class="mb-4">
          <el-button type="primary" @click="openCreateDialog('port')">创建端口规则</el-button>
        </div>
        <el-table :data="portRules" v-loading="loading" border stripe style="width: 100%">
          <el-table-column prop="protocol" label="协议" width="80" />
          <el-table-column prop="port" label="端口" width="100" />
          <el-table-column prop="sourceIp" label="来源 IP" />
          <el-table-column prop="policy" label="策略" width="100" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="danger" size="small" link @click="handleDelete('port', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- TODO: 分页器将在此处添加 -->
      </el-tab-pane>
      <el-tab-pane label="端口转发" name="forward">
         <div class="mb-4">
          <el-button type="primary" @click="openCreateDialog('forward')">创建端口转发</el-button>
        </div>
        <el-table :data="forwardRules" v-loading="loading" border stripe style="width: 100%">
          <el-table-column prop="protocol" label="协议" width="80" />
          <el-table-column prop="sourcePort" label="源端口" width="100" />
          <el-table-column prop="destIp" label="目标 IP" />
          <el-table-column prop="destPort" label="目标端口" width="100" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="danger" size="small" link @click="handleDelete('forward', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
         <!-- TODO: 分页器将在此处添加 -->
      </el-tab-pane>
      <el-tab-pane label="IP 规则" name="ip">
         <div class="mb-4">
          <el-button type="primary" @click="openCreateDialog('ip')">创建 IP 规则</el-button>
        </div>
        <el-table :data="ipRules" v-loading="loading" border stripe style="width: 100%">
          <el-table-column prop="sourceIp" label="来源 IP" />
          <el-table-column prop="policy" label="策略" width="100" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="danger" size="small" link @click="handleDelete('ip', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
         <!-- TODO: 分页器将在此处添加 -->
      </el-tab-pane>
    </el-tabs>

    <!-- 创建端口规则弹窗 -->
    <el-dialog v-model="portRuleDialogVisible" title="创建端口规则" width="500px" :close-on-click-modal="false" @close="portRuleFormRef?.clearValidate()">
      <el-form :model="portRuleForm" :rules="portRuleFormRules" ref="portRuleFormRef" label-width="80px">
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="portRuleForm.protocol" placeholder="请选择协议">
            <el-option label="TCP" value="TCP"></el-option>
            <el-option label="UDP" value="UDP"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="portRuleForm.port" placeholder="请输入端口号"></el-input>
        </el-form-item>
        <el-form-item label="来源IP" prop="sourceIp">
          <el-input v-model="portRuleForm.sourceIp" placeholder="请输入来源IP (留空为任意)"></el-input>
        </el-form-item>
         <el-form-item label="策略" prop="policy">
          <el-select v-model="portRuleForm.policy" placeholder="请选择策略">
            <el-option label="允许" value="allow"></el-option>
            <el-option label="拒绝" value="deny"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="portRuleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit('port')">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建端口转发弹窗 -->
    <el-dialog v-model="forwardRuleDialogVisible" title="创建端口转发" width="500px" :close-on-click-modal="false" @close="forwardRuleFormRef?.clearValidate()">
       <el-form :model="forwardRuleForm" :rules="forwardRuleFormRules" ref="forwardRuleFormRef" label-width="80px">
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="forwardRuleForm.protocol" placeholder="请选择协议">
            <el-option label="TCP" value="TCP"></el-option>
            <el-option label="UDP" value="UDP"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="源端口" prop="sourcePort">
          <el-input v-model="forwardRuleForm.sourcePort" placeholder="请输入源端口号"></el-input>
        </el-form-item>
        <el-form-item label="目标IP" prop="destIp">
          <el-input v-model="forwardRuleForm.destIp" placeholder="请输入目标 IP"></el-input>
        </el-form-item>
        <el-form-item label="目标端口" prop="destPort">
          <el-input v-model="forwardRuleForm.destPort" placeholder="请输入目标端口号"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forwardRuleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit('forward')">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建 IP 规则弹窗 -->
    <el-dialog v-model="ipRuleDialogVisible" title="创建 IP 规则" width="500px" :close-on-click-modal="false" @close="ipRuleFormRef?.clearValidate()">
      <el-form :model="ipRuleForm" :rules="ipRuleFormRules" ref="ipRuleFormRef" label-width="80px">
        <el-form-item label="来源IP" prop="sourceIp">
          <el-input v-model="ipRuleForm.sourceIp" placeholder="请输入来源 IP"></el-input>
        </el-form-item>
        <el-form-item label="策略" prop="policy">
          <el-select v-model="ipRuleForm.policy" placeholder="请选择策略">
            <el-option label="放行" value="allow"></el-option>
            <el-option label="屏蔽" value="block"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ipRuleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit('ip')">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.firewall-container {
  background-color: #fff;
  border-radius: 4px;
}
.mb-4 {
  margin-bottom: 1rem; /* 添加一些底部间距 */
}
</style> 