const { v4: uuidv4 } = require("uuid");
const { RaftEngine } = require("./src/raft");
const { createGrpcService, createGrpcServer } = require("./src/grpc");

const raftId = uuidv4();
const grpcAddress = process.argv[2];

console.log("raftid: " + raftId);
console.log("grpc address: " + grpcAddress);

const { proto, server } = createGrpcServer("raft", grpcAddress);

const proxyService = createGrpcService(
  "proxy",
  "ProxyService",
  "127.0.0.1:50051"
);

const raftEngine = new RaftEngine(raftId, proxyService);

server.addService(proto.RaftService.service, {
  HandleEvent: (call, callback) => {
    raftEngine.handleEvent(call.request);

    callback(null, null);
  },
  HandleMessage: (call, callback) => {
    console.log(`[message] ${call.request.json} from ${call.request.senderId}`);
  },
});

const interval = setInterval(function () {
  proxyService.SendHeartbeat(
    {
      id: raftId,
      address: grpcAddress,
      sentAt: new Date().getTime(),
    },
    (error) => {
      if (error) throw error;
    }
  );
}, 1000);
