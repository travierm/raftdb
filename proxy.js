const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = "./proto/proxy.proto";

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const proxyProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

server.addService(proxyProto.ProxyService.service, {
  SaveHeartbeat: (call, callback) => {
    console.log("got a heartbeat request from " + call.request.id);

    callback(null, null);
  },
});

server.bindAsync(
  "127.0.0.1:50051",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    console.log("RaftDB Proxy running at http://127.0.0.1:50051");
    server.start();
  }
);
