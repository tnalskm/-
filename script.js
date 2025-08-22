// 구글 앱스 스크립트 웹앱 URL (배포 후 여기에 실제 URL을 입력하세요)
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdWjDvu9dysnZyIXnkWZ39qOmAioAXand51SPRJEWev0Ta5AH8AB9zbd1FVgfZ3umA/exec';

// 메뉴 데이터
const menuData = [
    {
        id: 'americano',
        name: '아메리카노',
        price: 3000,
        available: true
    },
    {
        id: 'latte',
        name: '카페라떼',
        price: 3500,
        available: true
    },
    {
        id: 'cappuccino',
        name: '카푸치노',
        price: 3500,
        available: true
    },
    {
        id: 'espresso',
        name: '에스프레소',
        price: 2500,
        available: true
    },
    {
        id: 'macchiato',
        name: '카라멜 마키아토',
        price: 4000,
        available: true
    },
    {
        id: 'mocha',
        name: '카페모카',
        price: 4500,
        available: true
    }
];

// 현재 주문 정보
let currentOrder = {};

// DOM 요소들
const menuGrid = document.getElementById('menuGrid');
const orderForm = document.getElementById('orderForm');
const orderList = document.getElementById('orderList');
const totalPriceElement = document.getElementById('totalPrice');
const submitOrderButton = document.getElementById('submitOrder');
const orderStatus = document.getElementById('orderStatus');
const orderCompleteModal = document.getElementById('orderCompleteModal');
const orderNumberElement = document.getElementById('orderNumber');
const refreshStatusButton = document.getElementById('refreshStatus');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeMenu();
    setupEventListeners();
    loadOrderStatus();
});

// 메뉴 초기화
function initializeMenu() {
    menuGrid.innerHTML = '';

    menuData.forEach(item => {
        const menuItem = createMenuItemElement(item);
        menuGrid.appendChild(menuItem);
    });
}

// 메뉴 아이템 엘리먼트 생성
function createMenuItemElement(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.dataset.menuId = item.id;

    menuItem.innerHTML = `
        <h3>${item.name}</h3>
        <div class="price">${item.price.toLocaleString()}원</div>
        <div class="quantity-controls">
            <button type="button" class="quantity-btn minus-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
            <span class="quantity-display" id="quantity-${item.id}">0</span>
            <button type="button" class="quantity-btn plus-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        </div>
    `;

    return menuItem;
}

// 수량 업데이트
function updateQuantity(menuId, change) {
    const currentQuantity = currentOrder[menuId] ? currentOrder[menuId].quantity : 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity > 0) {
        const menuItem = menuData.find(item => item.id === menuId);
        currentOrder[menuId] = {
            ...menuItem,
            quantity: newQuantity
        };
    } else {
        delete currentOrder[menuId];
    }

    updateUI();
}

// UI 업데이트
function updateUI() {
    // 수량 표시 업데이트
    menuData.forEach(item => {
        const quantityElement = document.getElementById(`quantity-${item.id}`);
        const quantity = currentOrder[item.id] ? currentOrder[item.id].quantity : 0;
        quantityElement.textContent = quantity;

        // 메뉴 아이템 선택 상태 업데이트
        const menuElement = document.querySelector(`[data-menu-id="${item.id}"]`);
        if (quantity > 0) {
            menuElement.classList.add('selected');
        } else {
            menuElement.classList.remove('selected');
        }
    });

    // 주문 요약 업데이트
    updateOrderSummary();

    // 주문 버튼 활성화/비활성화
    const hasItems = Object.keys(currentOrder).length > 0;
    const customerName = document.getElementById('customerName').value.trim();
    submitOrderButton.disabled = !hasItems || !customerName;
}

// 주문 요약 업데이트
function updateOrderSummary() {
    const orderItems = Object.values(currentOrder);

    if (orderItems.length === 0) {
        orderList.innerHTML = '<p>선택된 메뉴가 없습니다.</p>';
        totalPriceElement.textContent = '0';
        return;
    }

    let orderHTML = '';
    let totalPrice = 0;

    orderItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        orderHTML += `
            <div class="order-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>${itemTotal.toLocaleString()}원</span>
            </div>
        `;
    });

    orderList.innerHTML = orderHTML;
    totalPriceElement.textContent = totalPrice.toLocaleString();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 이름 입력 시 주문 버튼 활성화 체크
    document.getElementById('customerName').addEventListener('input', updateUI);

    // 주문 제출
    orderForm.addEventListener('submit', handleOrderSubmit);

    // 주문 현황 새로고침
    refreshStatusButton.addEventListener('click', loadOrderStatus);

    // 모달 닫기
    const closeModal = document.querySelector('.close');
    closeModal.addEventListener('click', function() {
        orderCompleteModal.style.display = 'none';
    });

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === orderCompleteModal) {
            orderCompleteModal.style.display = 'none';
        }
    });
}

// 주문 제출 처리
async function handleOrderSubmit(event) {
    event.preventDefault();

    const customerName = document.getElementById('customerName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    if (!customerName) {
        showMessage('이름을 입력해주세요.', 'error');
        return;
    }

    if (Object.keys(currentOrder).length === 0) {
        showMessage('주문할 메뉴를 선택해주세요.', 'error');
        return;
    }

    // 주문 버튼 비활성화 및 로딩 표시
    submitOrderButton.disabled = true;
    submitOrderButton.innerHTML = '<span class="loading"></span> 주문 처리 중...';

    // 주문 데이터 생성
    const orderItems = Object.values(currentOrder).map(item => 
        `${item.name} x${item.quantity}`
    ).join(', ');

    const totalPrice = Object.values(currentOrder).reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
    );

    const orderData = {
        timestamp: new Date().toLocaleString('ko-KR'),
        customerName: customerName,
        phoneNumber: phoneNumber,
        items: orderItems,
        totalPrice: totalPrice,
        status: '대기중'
    };

    try {
        // 구글 시트에 데이터 전송
        const response = await sendToGoogleSheets(orderData);

        if (response.success) {
            // 주문 번호 생성 (현재 시간 기반)
            const orderNumber = Date.now().toString().slice(-6);

            // 성공 모달 표시
            showOrderCompleteModal(orderNumber);

            // 폼 초기화
            resetForm();

            // 주문 현황 새로고침
            loadOrderStatus();

            showMessage('주문이 성공적으로 접수되었습니다!', 'success');
        } else {
            throw new Error(response.message || '주문 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('주문 처리 오류:', error);
        showMessage('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
        // 주문 버튼 원래 상태로 복구
        submitOrderButton.disabled = false;
        submitOrderButton.innerHTML = '주문하기';
    }
}

// 구글 시트에 데이터 전송
async function sendToGoogleSheets(orderData) {
    if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        // 개발/테스트 모드: 실제 전송 없이 성공 시뮬레이션
        console.log('테스트 모드 - 주문 데이터:', orderData);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, message: '테스트 모드에서 주문이 접수되었습니다.' });
            }, 1000);
        });
    }

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.text();

        if (response.ok) {
            return { success: true, message: result };
        } else {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
    } catch (error) {
        console.error('구글 시트 전송 오류:', error);
        throw error;
    }
}

// 주문 현황 불러오기
async function loadOrderStatus() {
    const statusContainer = document.getElementById('orderStatus');
    statusContainer.innerHTML = '<div class="loading"></div> 주문 현황을 불러오는 중...';

    try {
        if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            // 테스트 모드: 샘플 데이터 표시
            displaySampleOrderStatus();
            return;
        }

        // 실제 구글 시트에서 데이터 가져오기 (향후 구현)
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getOrders`);
        const orders = await response.json();

        displayOrderStatus(orders);
    } catch (error) {
        console.error('주문 현황 로드 오류:', error);
        statusContainer.innerHTML = '<p>주문 현황을 불러오는데 실패했습니다.</p>';
    }
}

// 샘플 주문 현황 표시 (테스트용)
function displaySampleOrderStatus() {
    const sampleOrders = [
        {
            orderNumber: '001234',
            customerName: '김철수',
            items: '아메리카노 x2',
            totalPrice: 6000,
            status: '준비중',
            timestamp: '14:23'
        },
        {
            orderNumber: '001235',
            customerName: '이영희',
            items: '카페라떼 x1, 에스프레소 x1',
            totalPrice: 6000,
            status: '완료',
            timestamp: '14:18'
        },
        {
            orderNumber: '001236',
            customerName: '박민준',
            items: '카푸치노 x1',
            totalPrice: 3500,
            status: '대기중',
            timestamp: '14:25'
        }
    ];

    displayOrderStatus(sampleOrders);
}

// 주문 현황 표시
function displayOrderStatus(orders) {
    const statusContainer = document.getElementById('orderStatus');

    if (!orders || orders.length === 0) {
        statusContainer.innerHTML = '<p>현재 주문이 없습니다.</p>';
        return;
    }

    let statusHTML = '';

    orders.forEach(order => {
        const statusClass = getStatusClass(order.status);

        statusHTML += `
            <div class="status-item ${statusClass}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>${order.customerName} (주문번호: ${order.orderNumber || 'N/A'})</strong>
                    <span class="status-badge ${statusClass}">${order.status}</span>
                </div>
                <div style="color: #666; font-size: 0.9em; margin-bottom: 5px;">
                    ${order.items}
                </div>
                <div style="display: flex; justify-content: space-between; color: #666; font-size: 0.9em;">
                    <span>${order.timestamp}</span>
                    <span>${order.totalPrice?.toLocaleString() || 0}원</span>
                </div>
            </div>
        `;
    });

    statusContainer.innerHTML = statusHTML;
}

// 상태에 따른 CSS 클래스 반환
function getStatusClass(status) {
    const statusMap = {
        '대기중': 'pending',
        '준비중': 'preparing',
        '완료': 'ready',
        '픽업완료': 'completed'
    };

    return statusMap[status] || 'pending';
}

// 주문 완료 모달 표시
function showOrderCompleteModal(orderNumber) {
    orderNumberElement.textContent = orderNumber;
    orderCompleteModal.style.display = 'block';
}

// 폼 초기화
function resetForm() {
    currentOrder = {};
    document.getElementById('customerName').value = '';
    document.getElementById('phoneNumber').value = '';
    updateUI();
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;

    // 주문 폼 위에 메시지 삽입
    const orderSection = document.querySelector('.order-section');
    orderSection.insertBefore(messageDiv, orderSection.firstChild);

    // 3초 후 메시지 제거
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 전역 함수로 수량 업데이트 함수 등록
window.updateQuantity = updateQuantity;
