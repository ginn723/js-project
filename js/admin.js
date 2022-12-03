let orderData = [];
const orderList = document.querySelector(".js-orderList");

function init() {
  getOrderList();
  renderC3_lv2();
  // renderC3();
}

init();

// function renderC3() {
//   console.log(orderData);

//   // 物件資料搜集
//   let total = {};
//   orderData.forEach(function (item) {
//     item.products.forEach(function (productItem) {
//       if (total[productItem.category] == undefined) {
//         total[productItem.category] = productItem.price * productItem.quantity;
//       }
//     });
//   });
//   console.log(total);
//   // 做出資料關聯
//   let categoryAry = Object.keys(total);
//   console.log(categoryAry);
//   let newData = [];
//   categoryAry.forEach(function (item) {
//     let ary = [];
//     ary.push(item);
//     ary.push(total[item]);
//     newData.push(ary);
//   });
//   console.log(newData);

//   // C3.js
//   let chart = c3.generate({
//     bindto: "#chart", // HTML 元素綁定
//     data: {
//       type: "pie",
//       columns: newData,
//       // colors: {
//       //   "Louvre 雙人床架": "#DACBFF",
//       //   "Antony 雙人床架": "#9D7FEA",
//       //   "Anty 雙人床架": "#5434A7",
//       //   其他: "#301E5F",
//       // },
//     },
//   });
// }

function renderC3_lv2() {
  // 物件資料搜集
  let obj = {};
  orderData.forEach(function (item) {
    item.products.forEach(function (productItem) {
      if (obj[productItem.title] == undefined) {
        obj[productItem.title] = productItem.price * productItem.quantity;
      } else {
        obj[productItem.title] += productItem.price * productItem.quantity;
      }
    });
  });
  console.log(obj);

  // 拉出資料關聯
  let originAry = Object.keys(obj);
  console.log(originAry);
  // 透過 originAry,整理成 C3 格式
  let rankSortAry = [];

  originAry.forEach(function (item) {
    let ary = [];
    ary.push(item);
    ary.push(obj[item]);
    rankSortAry.push(ary);
  });
  console.log(rankSortAry);

  // 比大小，降冪排序（目的：取得營收前三個品項當主要色塊，把其餘的品項加總起來當成一個色塊）
  rankSortAry.sort(function (a, b) {
    return b[1] - a[1]; //那價格數字作比較
  });

  // 如果筆數超過 4 筆以上，就統整為其他
  if (rankSortAry.length > 3) {
    let otherTotal = 0;
    rankSortAry.forEach(function (item, index) {
      if (index > 2) {
        otherTotal += rankSortAry[index][1]; //訂單的總營業額去加總
      }
    });
    rankSortAry.splice(3, rankSortAry.length - 1);
    rankSortAry.push(["其他", otherTotal]);
  }

  // 超過三筆後將第四名之後的價格加總起來放在 otherTotal
  // C3.js
  c3.generate({
    bindto: "#chart2", // HTML 元素綁定
    data: {
      type: "pie",
      columns: rankSortAry,
    },
    color: {
      pattern: ["#201d15", "#301E5F", "#006a97", "#6e2349"],
    },
  });
}

function getOrderList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      orderData = response.data.orders;
      let str = "";
      orderData.forEach(function (item) {
        // 組時間字串
        const timeStamp = new Date(item.createdAt * 1000);
        const orderTime = `${timeStamp.getFullYear()}/${
          timeStamp.getMonth() + 1
        }/${timeStamp.getDate()}`;
        console.log(orderTime);

        // 組產品字串
        let productStr = "";
        item.products.forEach(function (productItem) {
          productStr += `
            <p>${productItem.title} x ${productItem.quantity}</p>
          `;
        });

        // 判斷訂單處理狀態
        let orderStatus = "";
        if (item.paid == true) {
          orderStatus = "已處理";
        } else {
          orderStatus = "未處理";
        }

        // 組訂單字串
        str += `
          <tr>
              <td>${item.id}</td>
              <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
              </td>
              <td>${item.user.address}</td>
              <td>${item.user.email}</td>
              <td>
                ${productStr}
              </td>
              <td>${orderTime}</td>
              <td class="js-orderStatus">
                <a href="#" class="orderStatus" data-status="${item.paid}" data-id="${item.id}">${orderStatus}</a>
              </td>
              <td>
                <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除" />
              </td>
            </tr>
        `;
      });
      orderList.innerHTML = str;
      renderC3_lv2();
    });
}

orderList.addEventListener("click", function (e) {
  e.preventDefault();
  // 刪除功能
  const targetClass = e.target.getAttribute("class");
  let id = e.target.getAttribute("data-id");
  if (targetClass == "delSingleOrder-Btn js-orderDelete") {
    deleteOrderItem(id);
    return;
  }
  if (targetClass == "orderStatus") {
    let status = e.target.getAttribute("data-status");
    changeOrderStatus(status, id);
    return;
  }
});

function changeOrderStatus(status, id) {
  console.log(status, id);
  let newStatus;
  if (status == true) {
    newStatus = false;
  } else {
    newStatus = true;
  }
  axios
    .put(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        data: {
          id: id,
          paid: newStatus,
        },
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      getOrderList(); //重新渲染 order
    });
}

function deleteOrderItem(id) {
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      swal({
        title: "刪除該筆訂單成功！",
        text: "",
        type: "info",
        confirmButtonColor: "#DD6B55",
        timer: 1500,
      });
      getOrderList(); //重新渲染 order
    });
}

// 刪除所有訂單
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      swal({
        title: "刪除所有訂單成功",
        text: "",
        type: "info",
        confirmButtonColor: "#DD6B55",
        timer: 1500,
      });
      getOrderList();
    });
});
