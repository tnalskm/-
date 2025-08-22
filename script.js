// 구글 앱스 스크립트 웹앱 URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdWjDvu9dysnZyIXnkWZ39qOmAioAXand51SPRJEWev0Ta5AH8AB9zbd1FVgfZ3umA/exec';

// (메뉴 데이터, currentOrder, DOM 요소 초기화 부분 생략)

document.addEventListener('DOMContentLoaded', () => {
  initializeMenu();
  setupEventListeners();
  loadOrderStatus();
});

async function handleOrderSubmit(event) {
  event.preventDefault();

  // 유효성 검사 (생략)

  // 주문 데이터 생성
  const orderData = {
    timestamp:    new Date().toLocaleString('ko-KR'),
    customerName: document.getElementById('customerName').value.trim(),
    phoneNumber:  document.getElementById('phoneNumber').value.trim(),
    items:        Object.values(currentOrder).map(i => `${i.name} x${i.quantity}`).join(', '),
    totalPrice:   String(Object.values(currentOrder).reduce((s,i) => s + i.price*i.quantity, 0)),
    status:       '대기중'
  };

  // 폼 전송
  try {
    const res = await sendToGoogleSheets(orderData);
    if (res.success) {
      showOrderCompleteModal(Date.now().toString().slice(-6));
      resetForm();
      loadOrderStatus();
      showMessage('주문이 성공적으로 접수되었습니다!', 'success');
    } else {
      throw new Error(res.message);
    }
  } catch (err) {
    console.error('주문 처리 오류:', err);
    showMessage('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
  } finally {
    submitOrderButton.disabled = false;
    submitOrderButton.textContent = '주문하기';
  }

  submitOrderButton.disabled = true;
  submitOrderButton.textContent = '주문 처리 중...';
}

// 구글 시트로 데이터 전송 (Form URL-encoded)
async function sendToGoogleSheets(orderData) {
  const form = new URLSearchParams();
  form.append('timestamp',    orderData.timestamp);
  form.append('customerName', orderData.customerName);
  form.append('phoneNumber',  orderData.phoneNumber);
  form.append('items',        orderData.items);
  form.append('totalPrice',   orderData.totalPrice);
  form.append('status',       orderData.status);

  const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    body: form
  });

  if (!resp.ok) {
    throw new Error(`서버 오류: ${resp.status}`);
  }
  return await resp.json();
}

// 주문 현황 불러오기 (GET)
async function loadOrderStatus() {
  orderStatus.innerHTML = '<div class="loading"></div> 주문 현황을 불러오는 중...';
  try {
    const resp = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getOrders`);
    if (!resp.ok) throw new Error(`서버 오류: ${resp.status}`);
    const orders = await resp.json();
    displayOrderStatus(orders);
  } catch (err) {
    console.error('주문 현황 로드 오류:', err);
    orderStatus.innerHTML = '<p>주문 현황을 불러오는 데 실패했습니다.</p>';
  }
}


