import React from 'react'
import { getSessionToken } from "@shopify/app-bridge-utils";
import { useAppBridge } from "@shopify/app-bridge-react";


function OrderTable({orders,setLoading,SetShowOrderDetails,SetOrderDetails,setOrderItems}) {
  const app = useAppBridge();


    const handleClick= async(item)=>{
        
       
        var id =item.id
        setLoading(true);
        const token = await getSessionToken(app);
          
          const res = await fetch(`/ordersdetails?id=${id}`, {
            headers: { Authorization: `Bearer ${token}`,},
          }
          );
          const responseData = await res.json();
          if (responseData.status == "OK") {
             
                SetOrderDetails(responseData.data)
                setOrderItems(responseData.data.line_items)
                
                SetShowOrderDetails(true)
               }
               else{
                alert("error in fetching data")
               }

          setLoading(false);



        // setLoading(true)
    }
    return (
        <div>
        <div className="Polaris-Page">
          <div className="Polaris-Page-Header Polaris-Page-Header--isSingleRow Polaris-Page-Header--mobileView Polaris-Page-Header--noBreadcrumbs Polaris-Page-Header--mediumTitle">
            <div className="Polaris-Page-Header__Row">
              <div className="Polaris-Page-Header__TitleWrapper">
                <div>
                  <div className="Polaris-Header-Title__TitleAndSubtitleWrapper">
                    <h1 className="Polaris-Header-Title"> Received Orders </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="Polaris-Page__Content">
            <div className="Polaris-Card">
              <div className="Polaris-DataTable--condensed">
                <div className="Polaris-DataTable__Navigation">
                  <div className="Polaris-DataTable__Pip Polaris-DataTable__Pip--visible"></div>
                  <div className="Polaris-DataTable__Pip Polaris-DataTable__Pip--visible"></div>
                  <div className="Polaris-DataTable__Pip Polaris-DataTable__Pip--visible"></div>
                  <div className="Polaris-DataTable__Pip Polaris-DataTable__Pip--visible"></div>
                  <div className="Polaris-DataTable__Pip Polaris-DataTable__Pip--visible"></div>
                </div>
                <div className="Polaris-DataTable Polaris-DataTable--condensed">
                  <div className="Polaris-DataTable__ScrollContainer">
                    <table className="Polaris-DataTable__Table">
                      <thead>
                        <tr>
                          <th data-polaris-header-cell="true" className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--firstColumn Polaris-DataTable__Cell--header DataTableText" scope="col">Email</th>
                          <th data-polaris-header-cell="true" className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric DataTableText" scope="col">Order Number</th>
                          <th data-polaris-header-cell="true" className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric DataTableText" scope="col">Order id</th>
                          <th data-polaris-header-cell="true" className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric DataTableText" scope="col">Total Price</th>
                          <th data-polaris-header-cell="true" className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric DataTableText" scope="col">SKU</th>
                        </tr>   
                      </thead>
                      <tbody>
                      {orders.map((val,index)=>
                        <tr className="Polaris-DataTable__TableRow Polaris-DataTable--hoverable DataTableText" key={index} onClick={()=>{handleClick(val)}}>
                          <th className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--firstColumn" scope="row">{val.email}</th>
                          <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric DataTableText">{val.order_number}</td>
                          <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric DataTableText">{val.id}</td>
                          <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric DataTableText">{"PKR "+val.total_price}</td>
                          <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric DataTableText">{"" +val.sku}</td>
                        </tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    )
}

export default OrderTable
