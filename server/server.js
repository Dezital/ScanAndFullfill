import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion, DataType } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import Shop from "./models/shopsettings";
const mongoose = require("mongoose");
const koaBody = require("koa-body");

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const dbURI =
  "mongodb+srv://zeshan:Dezital123@dezital.dkjyz.mongodb.net/dezital?retryWrites=true&w=majority";

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOSTLT.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );
  // Moongoos connection
  mongoose
    .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
      console.log("connect to server");
    })
    .catch((err) => {
      console.log(err);
    });

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  // toupdate fullfilled tags  of store
  router.post("/updatetags", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const tagsupdate = JSON.parse(ctx.request.body).tagsupdate;

    try {
      await Shop.updateOne(
        { shopName: shop },
        {
          FullfillTags: tagsupdate,
        },
        { upsert: true }
      )
        .then((result) => {
          console.log("updated tags", result);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {}
  });
  router.post("/updatePartialTags", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const tagsupdate = JSON.parse(ctx.request.body).tagsupdate;

    try {
      await Shop.updateOne(
        { shopName: shop },
        {
          ParticalTags: tagsupdate,
        },
        { upsert: true }
      )
        .then((result) => {
          console.log("updated tags", result);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {}
  });
  //toupdate carrier of the store
  router.post("/updateCarrier", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const carriers = JSON.parse(ctx.request.body).carrier;
    console.log("carriers");

    try {
      await Shop.updateOne(
        { shopName: shop },
        {
          carrier: carriers,
        },
        { upsert: true }
      )
        .then((result) => {
          console.log("updated carriers", result);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {}
  });

  // file to load on start of app
  router.get("/getMyShopSettings", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    // console.log("Logging shop", shop);

    try {
      await Shop.findOne({ shopName: shop })
        .then((result) => {
          console.log("found", result);
          var response = result;
          ctx.body = {
            status: "OK",
            data: response,
          };
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {}
    ctx.status = 200;
  });

  // To Fetch Products from store
  router.get("/products", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    console.log("Logging shop", shop);
    let productList = [];
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      console.log("Logging After Client", client);
      await client
        .get({
          path: `products`,
        })
        .then(({ body }) => {
          productList = body.products;
        })
        .catch((err) => console.log(err));
      console.log("Logging products", productList);
      console.log("products load 3rd time");
    } catch (err) {
      console.log("Err in cath", err);
    }
    ctx.body = {
      status: "OK",
      data: productList,
    };
    ctx.status = 200;
  });
  // To Fetch all orders from store
  router.get("/orders", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    // console.log("Logging shop", shop);
    let ordersList = [];
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );

      // console.log("Logging After Client", client);
      await client
        .get({
          path: `orders`,
          query: { status: "any" },
        })
        .then(({ body }) => {
          ordersList = body.orders;
        })
        .catch((err) => console.log(err));
      // console.log("Logging orders", ordersList);
    } catch (err) {
      console.log("Err in cath", err);
    }
    ctx.body = {
      status: "OK",
      data: ordersList,
    };
    ctx.status = 200;
  });

  // To fetch single order details
  router.get("/ordersdetails", async (ctx) => {
    let id = ctx.request.url;
    let productid = id.replace("/ordersdetails?id=", "");

    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;

    let ordersList = [];
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );

      await client
        .get({
          path: `orders/${productid}`,
        })
        .then(({ body }) => {
          ordersList = body.order;
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log("Err in cath", err);
    }
    ctx.body = {
      status: "OK",
      data: ordersList,
    };
    ctx.status = 200;
  });
  // For metafeild
  router.post("/settings", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    console.log("App for this meta data and metafeild");
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .get({
          path: "locations",
        })
        .then(({ body }) => {
          console.log("response body", body.locations[0].id);
          var locationid = body.locations[0].id;
        })
        .catch((err) => console.log(err));
    } catch (error) {}

    // try {
    //   const client = new Shopify.Clients.Rest(
    //     session.shop,
    //     session.accessToken
    //   );

    //   console.log("Logging After Client", client);
    //   await client
    //     .post({
    //       path: "metafields",
    //       data: {"metafield":{"namespace":"inventory00","key":"warehouse","value":25,"type":"number_integer","owner_resource":"shop"}},
    //       type: DataType.JSON,
    //     })
    //     .then(({ body }) => {
    //       console.log(body);
    //       console.log("Yar hogaya hai")
    //     })
    //     .catch((err) => console.log("this is errors",err));
    // } catch (err) {
    //   console.log("Err in cath", err);
    // }
    // ctx.body = {
    //   status: "OK",
    //   data: ordersList,
    // };
    // ctx.status = 200;
  });

  // To Update the Order details
  router.post("/updateorder", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const TrackingNumber = JSON.parse(ctx.request.body).trackinNumber;
    var tags = JSON.parse(ctx.request.body).tags;
    const orderdetails = JSON.parse(ctx.request.body).orderdetails;
    const orderItems = JSON.parse(ctx.request.body).orderItems;
    const trackingCompany = JSON.parse(ctx.request.body).trackingCompany;
    const trackingURl = JSON.parse(ctx.request.body).trackingURl;

    const orderid = orderdetails.id;
    const locationid = orderdetails.location_id;
    var tag = tags.toString();
    var respon = [];

    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .put({
          path: `orders/${orderid}`,
          data: { order: { id: orderid, tags: tag } },
          type: DataType.JSON,
        })
        .then(({ body }) => {
          ctx.body = {
            status1: "OK",
          };
          ctx.status = 100;
        })
        .catch((err) => console.log(err));
    } catch (error) {}
    //hello start

    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .post({
          path: `orders/${orderid}/fulfillments`,
          data: {
            fulfillment: {
              location_id: locationid,
              tracking_number: TrackingNumber,
              tracking_company: trackingCompany,
              tracking_urls: [trackingURl],
              notify_customer: false,
            },
          },
          type: DataType.JSON,
        })
        .then(({ body }) => {
          ctx.body = {
            status: "OK",
          };
          ctx.status = 200;
        })
        .catch((err) => {
          console.log("Error in  fullfillmet", err);
          ctx.body = {
            status: "False",
          };
          ctx.status = 400;
        });
    } catch (error) {
      console.log("errro in fullfilment");
    }
  });

  router.post("/particalFulFilment", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const TrackingNumber = JSON.parse(ctx.request.body).trackinNumber;
    var tags = JSON.parse(ctx.request.body).tags;
    const orderdetails = JSON.parse(ctx.request.body).orderdetails;
    const orderItems = JSON.parse(ctx.request.body).orderItems;
    const trackingCompany = JSON.parse(ctx.request.body).trackingCompany;
    const trackingURl = JSON.parse(ctx.request.body).trackingURl;

    orderItems.forEach((element) => {
    
      var quantity=element["scanned"];
      element["quantity"] = quantity;
    });

    console.log("order items", orderItems);

    const orderid = orderdetails.id;
    const locationid = orderdetails.location_id;
    var tag = tags.toString();
    var respon = [];
    var Data_error;




    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .post({
          path: `orders/${orderid}/fulfillments`,
          data: {
            fulfillment: {
              "location_id": locationid,
              "tracking_number": "232323",
              "tracking_company": "TCS",
              "tracking_urls": ["www.htttps.com"],
              "notify_customer": false,
              "line_items": orderItems,
            },
          },
          type: DataType.JSON,
        })
        .then(({ body }) => {
          ctx.body = {
            status: "OK",
          };
          ctx.status = 200;
        })
        .catch((err) => {
          console.log("Error in  fullfillmet in cath", err);
          ctx.body = {
            status: "False",
          };
          ctx.status = 400;
        });
    } catch (error) {
      console.log("errro in fullfilment",error);
    }
    

   
    //hello start
  });

  //to getproductImages and barcode
  router.post("/getImage", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    const product_id = JSON.parse(ctx.request.body).product_id;
    const variant_id = JSON.parse(ctx.request.body).variant_id;

    var respon = [];
    let responseBarcode;
    console.log("Product id of the product", product_id);
    //
    let image;
    let varient;
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .get({
          path: `products/${product_id}/images`,
        })
        .then(({ body }) => {
          respon = body.images;
          image = respon[0].src;
        })

        .catch((err) => console.log(err));
    } catch (error) {}

    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .get({ path: `variants/${variant_id}` })
        .then(({ body }) => {
          const des = body;
          let { variant } = des;
          let { barcode } = variant;
          responseBarcode = barcode;
          console.log(barcode);
        })
        .catch((err) => console.log(err));
    } catch (error) {}
    //

    ctx.body = {
      status: "OK",
      data: image,
      barcode: responseBarcode,
    };
    ctx.status = 200;
  });
  //metafields
  router.get("/getMetafeild", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .post({
          path: "metafields",
          data: {
            metafield: {
              namespace: "inventory1",
              key: "warehouse2",
              value: "25",
              type: "single_line_text_field",
            },
          },
          type: DataType.JSON,
        })
        .then(({ body }) => {
          console.log(body);
        })

        .catch((err) => console.log(err.response.body));
    } catch (error) {}

    // ctx.body = {
    //   status: "OK",
    //   data: image,
    //   barcode:responseBarcode,
    // };
    // ctx.status = 200;
  });

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(koaBody());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
