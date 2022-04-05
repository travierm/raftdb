const grpc = require("@grpc/grpc-js");
const { v4: uuidv4 } = require("uuid");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = "./proto/proxy.proto";

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const ProxyService = grpc.loadPackageDefinition(packageDefinition).ProxyService;

const proxy = new ProxyService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

const raftId = uuidv4();

console.log("raftid: " + raftId);

const interval = setInterval(function () {
  proxy.SaveHeartbeat(
    {
      id: raftId,
      sentAt: new Date().getTime(),
    },
    (error) => {
      if (error) throw error;
      console.log("saved heartbeat");
    }
  );
}, 5000);
