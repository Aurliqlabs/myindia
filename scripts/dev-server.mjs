import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root=process.cwd();
const port=Number(process.env.PORT||3000);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg"};

http.createServer(async(req,res)=>{
  try{
    const raw=(req.url||"/").split("?")[0];
    const requested=raw==="/"?"/index.html":raw;
    const safe=normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
    let path=join(root,safe);
    if(!path.startsWith(root))throw new Error("Invalid path");
    const info=await stat(path);
    if(info.isDirectory())path=join(path,"index.html");
    const body=await readFile(path);
    res.writeHead(200,{"Content-Type":mime[extname(path).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(body);
  }catch{
    res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});
    res.end("Not found");
  }
}).listen(port,"127.0.0.1",()=>{
  console.log("");
  console.log("REPUBLIC: 543 development server");
  console.log(`Open: http://localhost:${port}`);
  console.log("Press Ctrl+C to stop.");
  console.log("");
});
