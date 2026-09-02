import { chromium } from "playwright";
const b=await chromium.launch();
const shot=async(name,url,opts={})=>{
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,...opts});
  const p=await ctx.newPage();
  await p.goto(url,{waitUntil:"networkidle"});
  await p.waitForTimeout(1500);
  await p.screenshot({path:`screens/${name}.png`,fullPage:opts.full||false});
  console.log("  screens/"+name+".png");
  await ctx.close();
};
await shot("00-landing","http://localhost:3111/",{full:true});
await shot("00b-onboarding","http://localhost:3111/app");
await b.close();
