import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion, DataType } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import Shop from "./models/shopsettings";
import { createClient, getSubscriptionUrl ,getAppSubscriptionStatus} from "./handlers";
import helmet from "koa-helmet";

const mongoose = require("mongoose");
const koaBody = require("koa-body");
var cron = require("node-cron");
const nodemailer = require("nodemailer");
let ctxglobal;
const crypto = require("crypto");
let newhost;

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const dbURI =
  "mongodb+srv://zeshan:Dezital123@dezital.dkjyz.mongodb.net/dezital?retryWrites=true&w=majority&ssl=true";

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
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


  const setContentSecurityHeader = (ctx, next) => {
    // Cookie is set after auth
    if (ctx.cookies.get("shopOrigin")) {
      return helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
          frameAncestors: [
            `https://${ctx.cookies.get("shopOrigin")}`,
            "https://admin.shopify.com",
          ],
        },
      })(ctx, next);
    } else {
      // Before auth => no cookie set...
      return helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
          frameAncestors: [
            `https://${ctx.query.shop}`,
            "https://admin.shopify.com",
          ],
        },
      })(ctx, next);
    }
  };
  server.use(setContentSecurityHeader);
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        newhost=host;

        // set shopOrigin cookie, so it can be used for click jacking header
        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        

        /* added this section for Billing API implementation */
        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>{
            console.log("WEBHOOK")
            delete ACTIVE_SHOPIFY_SHOPS[shop]
           
          }
         
        }
        );
        if (response.success){
          console.log("response is here ",response)

        }
        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }
        
   

        // Redirect to app with shop parameter upon auth
         ctx.redirect(`/?shop=${shop}&host=${host}`);
        // console.log(ctx);
        // await getSubscriptionUrl(ctx);
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
  router.get("/billingurl",async (ctx)=>{
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const client = createClient(session.shop,session.accessToken);
    const hasSubscription = await getAppSubscriptionStatus(client)
    if(hasSubscription){
       console.log("This shop has already subscribed to billing")
       ctx.body={
         status:"OK"
       }
        
    }else{
      console.log("Not already subscribed")
      console.log("host of the new app ",ctx.query.host);
      console.log("host that saved in url ",newhost)
      await getSubscriptionUrl(client,session.shop,newhost)
      .then((billingUrl) => {
       ctx.body={
         status:"pending",
         data:billingUrl,
       }
      })
      .catch((err) => {
        console.log(err);
      });


    }
    ctx.status=200;

  })
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

  router.get("/getMyShopSettings", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const shop = session.shop;
    try {
      await Shop.findOne({ shopName: shop })
        .then((result) => {
          // console.log("found", result);
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
    let productList = [];
    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );

      await client
        .get({
          path: `products`,
        })
        .then(({ body }) => {
          productList = body.products;
        })
        .catch((err) => console.log(err));
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
    const client = createClient(session.shop, session.accessToken);

    let ordersList = [];
    try {
      const clients = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await clients
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

  // searching order by order number
  router.post("/ordersNumber", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    let ordernumberrecived=  JSON.parse(ctx.request.body).ordernumber;
    if(ordernumberrecived.includes('#')){
      ordernumberrecived.replace('#','')
    }
    const order_number = JSON.parse(ctx.request.body).ordernumber;
    let ordersList = [];

    try {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      await client
        .get({
          path: `orders`,
          query: { name: order_number },
        })
        .then(({ body }) => {
          console.log(body);
          ordersList = body.orders;
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log("Err in cath", err);
    }
    if (ordersList.length > 0) {
      var orderid = ordersList[0].id;
      let ordersDetails = [];

      try {
        const client = new Shopify.Clients.Rest(
          session.shop,
          session.accessToken
        );
        await client
          .get({
            path: `orders/${orderid}`,
          })
          .then(({ body }) => {
            console.log("product detatis for an order");
            ordersDetails = body.order;
          })
          .catch((err) => console.log(err));
      } catch (err) {
        console.log("Err in cath", err);
      }
      ctx.body = {
        status: "OK",
        data: ordersDetails,
      };
      ctx.status = 200;
    } else {
      ctx.body = {
        status: "NOTFOUND",
      };
      ctx.status = 200;
    }
  });

  // To fetch single order details
  router.get("/ordersdetails", async (ctx) => {
    let id = ctx.request.url;
    let productid = id.replace("/ordersdetails?id=", "");
    let ordersList = [];
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);

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

  // For Adding settings
  router.post("/settings", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
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
  });

  // To Update the Order details
  router.post("/updateorder", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const TrackingNumber = JSON.parse(ctx.request.body).trackinNumber;
    var tags = JSON.parse(ctx.request.body).tags;
    console.log('orders details',orderdetails)
    const orderdetails = JSON.parse(ctx.request.body).orderdetails;
    const trackingCompany = JSON.parse(ctx.request.body).trackingCompany;
    const trackingURl = JSON.parse(ctx.request.body).trackingURl;
    const orderid = orderdetails.id;
    let locationid = orderdetails.location_id;

    console.log("tracking number",trackingCompany,trackingURl,orderid,locationid)
      if(locationid == null){
        try {
          const client = new Shopify.Clients.Rest(
            session.shop,
            session.accessToken
          );
          await client
            .get({
              path: `locations`,
             
            })
            .then(({ body }) => {
              console.log("here we are in locatoion ",body.locations[0]);
              locationid=body.locations[0].id;
              ctx.body = {
                status3: "OK",
              };
              ctx.status = 100;
            })
            .catch((err) => console.log(err));
        } catch (error) {}


      }
  
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
    console.log("location id set",locationid)

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

  //partial fullfillment
  router.post("/particalFulFilment", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const TrackingNumber = JSON.parse(ctx.request.body).trackinNumber;
    var tags = JSON.parse(ctx.request.body).tags;
    const orderdetails = JSON.parse(ctx.request.body).orderdetails;
    const orderItems = JSON.parse(ctx.request.body).orderItems;
    const trackingCompany = JSON.parse(ctx.request.body).trackingCompany;
    const trackingURl = JSON.parse(ctx.request.body).trackingURl;

    orderItems.forEach((element) => {
      var quantity = element["scanned"];
      element["quantity"] = quantity;
    });
    const orderid = orderdetails.id;
    const locationid = orderdetails.location_id;

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
              line_items: orderItems,
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
      console.log("errro in fullfilment", error);
    }
  });

  //to getproductImages and barcode
  router.post("/getImage", async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const product_id = JSON.parse(ctx.request.body).product_id;
    const variant_id = JSON.parse(ctx.request.body).variant_id;
    var respon = [];
    let responseBarcode;
    let image;

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
    ctx.body = {
      status: "OK",
      data: image,
      barcode: responseBarcode,
    };
    ctx.status = 200;
  });

  router.post("/sendMail", async (ctx) => {
    // const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    // const product_id = JSON.parse(ctx.request.body).product_id;
    // const variant_id = JSON.parse(ctx.request.body).variant_id;
    const email=JSON.parse(ctx.request.body).email;
    const name=JSON.parse(ctx.request.body).name;
    const message=JSON.parse(ctx.request.body).message;

    const transporter = nodemailer.createTransport({
      host: "smtppro.zoho.com", //replace with your email provider
      port: 465,
      secure:true,
      auth: {
        user: "appsupport@dezital.com",
        pass: "AppSupport@11211",
      },
    });

    const mail = {
      from:"appsupport@dezital.com",
      to:"appsupport@dezital.com" ,
    //  bcc:"dezital.shopifyapps@gmail.com",
      subject: "Message from App",
      text: `By ${name} email:${email} message:${message}`,
    };
    let res;

    transporter.sendMail(mail, (err, data) => {
      if (err) {
        console.log(err);
        // ctx.response(500)
        // res.status(500).send("Something went wrong.");
      } else {
        console.log("send message")
        ctx.response(200)
        // res.status(200).send("Email successfully sent to recipient!");
      }
    });
 

  });

  router.post("/webhooks", async (ctx) => {
    const shop = ctx.request.header['x-shopify-shop-domain'];
    console.log(shop)
    delete ACTIVE_SHOPIFY_SHOPS[shop];
    console.log("deleted")
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });
  
  function verifyWebhookRequest(body,req) {
    try {
      const generatedHash = crypto
        .createHmac("SHA256", Shopify.Context.API_SECRET_KEY)
        .update(JSON.stringify(body), "utf8")
        .digest("base64");
      const ShopifyHeader = 'x-shopify-hmac-sha256';
      console.log('generated hash',generatedHash);
    
      const hmac = req.get(ShopifyHeader); 
      console.log('hmac')
      const safeCompareResult = Shopify.Utils.safeCompare(generatedHash, hmac);
      console.log('comparision results',safeCompareResult)
      if (safeCompareResult) {
        console.log('Safe')
        return true;
      } else {
        console.log('Not Safe')
        return false;
      }
    } catch (error) {
      console.log('error', error)
      return false;
    }
 }

router.post("/data_request", (ctx) => {

    if (verifyWebhookRequest(ctx.request.body,ctx.request) === true) {
    console.log('verified :)')
    ctx.res.statusCode = 200;
// do something with the ctx.request.body
  } else {
    console.log('Not verified')
  ctx.res.statusCode = 401;
  }
  // ctx.res.statusCode = 200;
  // console.log('ctx is ',ctx)
  // console.log(ctx.res)

  // console.log("data request for that")
  // try {
  //   await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
  //   console.log(`Webhook processed, returned status code 200`);
  // } catch (error) {
  //   console.log(`Failed to process webhook: ${error}`);
  // }
  

});
router.post("/shop/redact",  (ctx) => {

  if (verifyWebhookRequest(ctx.request.body,ctx.request) === true) {
    console.log('verified :)')
    ctx.res.statusCode = 200;
// do something with the ctx.request.body
  } else {
    console.log('Not verified')
  ctx.res.statusCode = 401;
  }

 
});
router.post("/customers/redact", (ctx) => {
 
  if (verifyWebhookRequest(ctx.request.body,ctx.request) === true) {
    console.log('verified :)')
    ctx.res.statusCode = 200;
// do something with the ctx.request.body
  } else {
    console.log('Not verified')
  ctx.res.statusCode = 401;
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
      ctx.response.statusCode=401;
      
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
