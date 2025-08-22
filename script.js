// 구글 앱스 스크립트 웹앱 URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdWjDvu9dysnZyIXnkWZ39qOmAioAXand51SPRJEWev0Ta5AH8AB9zbd1FVgfZ3umA/exec';

// 메뉴 데이터 (생략)

let currentOrder = {};

// DOM 요소 (생략)

document.addEventListener('DOMContentLoaded', () => {
  initializeMenu();
  setupEventListeners();
  loadOrderStatus();
});

function handleOrderSubmit(event) {
  event.preventDefault();

  // 유효성 검사 (생략)

  // 주문 데이터 생성
  const orderData = {
    timestamp:    new Date().toLocaleString('ko-KR'),
    customerName: document.getElementById('customerName').value.trim(),
    phoneNumber:  document.getElementById('phoneNumber').value.trim(),
    items:        Object.values(currentOrder).map(i => `${i.name} x${i.quantity}`).join(', '),
    totalPrice:   Object.values(currentOrder).reduce((s,i) => s + i.price*i.quantity, 0),
    status:       '대기중'
  };

  // 폼 전송
  sendToGoogleSheets(orderData)
    .then(res => {
      if (res.success) {
        showOrderCompleteModal(Date.now().toString().slice(-6));
        resetForm();
        loadOrderStatus();
        showMessage('주문이 성공적으로 접수되었습니다!', 'success');
      } else {
        throw new Error(res.message);
      }
    })
    .catch(err => {
      console.error('주문 처리 오류:', err);
      showMessage('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    })
    .finally(() => {
      submitOrderButton.disabled = false;
      submitOrderButton.textContent = '주문하기';
    });

  submitOrderButton.disabled = true;
  submitOrderButton.textContent = '주문 처리 중...';
}

// 구글 시트로 데이터 전송 (Form URL-encoded)
async function sendToGoogleSheets(orderData) {
  // 테스트 모드 처리 (생략)
  const form = new URLSearchParams(orderData);
  const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    body: form
  });
  if (!resp.ok) throw new Error(`서버 오류: ${resp.status}`);
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

// doPost 에서 e.parameter로 폼 필드 읽기: Apps Script 측 코드도 아래처럼 수정했어야 합니다:
/*
function doPost(e) {
  const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e.parameter || !e.parameter.customerName) throw new Error('필수 데이터 누락');
    const orderData = {
      timestamp:    e.parameter.timestamp,
      customerName: e.parameter.customerName,
      phoneNumber:  e.parameter.phoneNumber,
      items:        e.parameter.items,
      totalPrice:   e.parameter.totalPrice,
      status:       e.parameter.status
    };
    const result = saveOrderToSheet(orderData);
    output.setContent(JSON.stringify({ success: true, orderNumber: result.orderNumber }));
    return output;
  } catch(err) {
    return output.setContent(JSON.stringify({ success: false, message: err.message }));
  }
}
*/

