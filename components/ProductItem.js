import React from 'react'

function ProductItem({product}) {
    console.log(product)
    return (
        <div>
            {product.name}
        </div>
    )
}

export default ProductItem
