// console.log(api_path, token);

const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartList = document.querySelector(".shoppingCart-tableList");
let productData = [];
let cartData = []; //購物車列表
function init() {
  getProductList();
  getCartList();
}

init();

function getProductList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`
    )
    .then(function (response) {
      productData = response.data.products;
      renderProductList();
    });
}

function combineProductHTMLItem(item) {
  return `
          <li class="productCard">
            <h4 class="productType">新品</h4>
            <img
              src="${item.images}"
              alt=""
            />
            <a href="#" class="js-addCart" id="addCardBtn" data-id="${
              item.id
            }">加入購物車</a>
            <h3>${item.title}</h3>
            <del class="originPrice">NT$ ${toThousands(item.origin_price)}</del>
            <p class="nowPrice">NT$ ${toThousands(item.price)}</p>
          </li>
        `;
}
function renderProductList() {
  let str = "";
  productData.forEach(function (item) {
    str += combineProductHTMLItem(item);
  });
  productList.innerHTML = str;
}

productSelect.addEventListener("change", function (e) {
  const category = e.target.value;
  if (category == "全部") {
    renderProductList();
    return;
  }
  let str = "";
  productData.forEach(function (item) {
    if (item.category == category) {
      str += combineProductHTMLItem(item);
    }
  });
  productList.innerHTML = str;
});

// 加入購物車
productList.addEventListener("click", function (e) {
  e.preventDefault();
  let addCartClass = e.target.getAttribute("class");
  if (addCartClass !== "js-addCart") {
    return;
  }
  let productId = e.target.getAttribute("data-id");
  // console.log(productId);

  let numCheck = 1;
  cartData.forEach(function (item) {
    if (item.product.id === productId) {
      numCheck = item.quantity += 1;
    }
  });
  axios
    .post(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`,
      {
        data: {
          productId: productId,
          quantity: numCheck,
        },
      }
    )
    .then(function (response) {
      swal({
        title: "已加入購物車!",
        text: "",
        timer: 1500,
        showConfirmButton: true,
      });
      getCartList();
    });
});

// 取得購物車列表
function getCartList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`
    )
    .then(function (response) {
      //計算總價格
      document.querySelector(".js-total").textContent = toThousands(
        response.data.finalTotal
      );

      cartData = response.data.carts;
      let str = "";
      cartData.forEach(function (item) {
        str += `
          <tr>
              <td>
                <div class="cardItem-title">
                  <img src="${item.product.images}" alt="" />
                  <p>${item.product.title}</p>
                </div>
              </td>
              <td>NT$ ${toThousands(item.product.price)}</td>
              <td>${item.quantity}</td>
              <td>NT$ ${toThousands(item.product.price * item.quantity)}</td>
              <td class="discardBtn">
                <a href="#" class="material-icons" data-id="${
                  item.id
                }"> clear </a>
              </td>
            </tr>
        `;
      });
      cartList.innerHTML = str;
    });
}

// 刪除功能
cartList.addEventListener("click", function (e) {
  e.preventDefault(); //取消默認行爲
  const cartId = e.target.getAttribute("data-id");
  if (cartId == null) {
    swal("你點到其他東西了");
    return;
  }
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`
    )
    .then(function (response) {
      swal("刪除單筆購物車");
      getCartList();
    });
});

// 刪除全部購物車流程
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`
    )
    .then(function (response) {
      swal("刪除全部購物車成功！");
      getCartList();
    })
    .catch(function (err) {
      swal("購物車已清空，請勿重複點擊！");
    });
});

// 送出訂單
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (cartData.length == 0) {
    swal({
      title: "請填寫正確的資訊!",
      text: "2秒后自动关闭",
      timer: 2000,
      showConfirmButton: true,
    });
    return;
  }

  const customerName = document.querySelector("#customerName").value;
  const customerPhone = document.querySelector("#customerPhone").value;
  const customerEmail = document.querySelector("#customerEmail").value;
  const customerAddress = document.querySelector("#customerAddress").value;
  const customerTradeWay = document.querySelector("#tradeWay").value;
  console.log(
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerTradeWay
  );
  if (
    customerName == "" ||
    customerPhone == "" ||
    customerEmail == "" ||
    customerAddress == "" ||
    customerTradeWay == ""
  ) {
    swal({
      title: "請勿填入空資訊!",
      text: "2秒后自动关闭",
      timer: 2000,
      showConfirmButton: true,
    });
    return;
  }
  if (validateEmail(customerEmail) == false) {
    swal("請填寫正確的Email格式", "", "warning");
    return;
  }

  axios
    .post(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,
      {
        data: {
          user: {
            name: customerName,
            tel: customerPhone,
            email: customerEmail,
            address: customerAddress,
            payment: customerTradeWay,
          },
        },
      }
    )
    .then(function (response) {
      swal("訂單建立成功");
      document.querySelector("#customerName").value = "";
      document.querySelector("#customerPhone").value = "";
      document.querySelector("#customerEmail").value = "";
      document.querySelector("#customerAddress").value = "";
      document.querySelector("#customerEmail").value = "";
      document.querySelector("#tradeWay").value = "ATM";
      getCartList();
    });
});

const customerEmail = document.querySelector("#customerEmail");
customerEmail.addEventListener("blur", function (e) {
  if (validateEmail(customerEmail.value) == false) {
    //顯示 email 的 error 格式
    document.querySelector(`[data-message="信箱"]`).textContent =
      "請填寫正確 Email 格式";
    return;
  }
});

const customerPhone = document.querySelector("#customerPhone");
customerPhone.addEventListener("blur", function (e) {
  if (validatePhone(customerPhone.value) == false) {
    //顯示 phone 的 error 格式
    document.querySelector(`[data-message="電話"]`).textContent =
      "請填寫正確電話格式";
    return;
  }
});

// util.js
function toThousands(x) {
  let parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

// email 驗證
function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
}

// 手機驗證
function validatePhone(phone) {
  // validatePhone('0912345678') //true 要加 '' 來測試
  if (/^[09]{2}\d{8}$/.test(phone)) {
    return true;
  }
  return false;
}

// validate.js
const inputs = document.querySelectorAll("input[name],select[data=payment]");
const form = document.querySelector(".orderInfo-form");
const constraints = {
  姓名: {
    presence: {
      message: "必填欄位",
    },
  },
  電話: {
    presence: {
      message: "必填欄位",
    },
    length: {
      minimum: 8,
      message: "需超過 8 碼",
    },
  },
  信箱: {
    presence: {
      message: "必填欄位",
    },
    email: {
      message: "格式錯誤",
    },
  },
  寄送地址: {
    presence: {
      message: "必填欄位",
    },
  },
  交易方式: {
    presence: {
      message: "必填欄位",
    },
  },
};

inputs.forEach((item) => {
  item.addEventListener("change", function () {
    item.nextElementSibling.textContent = "";
    let errors = validate(form, constraints) || "";
    console.log(errors);

    if (errors) {
      Object.keys(errors).forEach(function (keys) {
        // console.log(document.querySelector(`[data-message=${keys}]`))
        document.querySelector(`[data-message="${keys}"]`).textContent =
          errors[keys];
      });
    }
  });
});
