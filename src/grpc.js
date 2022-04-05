const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

function createGrpcService(protoFile, serviceName, address) {
  const packageDefinition = protoLoader.loadSync(
    `./proto/${protoFile}.proto`,
    options
  );

  const Service = grpc.loadPackageDefinition(packageDefinition)[serviceName];
  return new Service(address, grpc.credentials.createInsecure());
}

function createGrpcServer(protoFile, address) {
  const packageDefinition = protoLoader.loadSync(
    `./proto/${protoFile}.proto`,
    options
  );
  const proto = grpc.loadPackageDefinition(packageDefinition);
  const server = new grpc.Server();

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      console.log("grpc server running at " + address);
      server.start();
    }
  );

  return { proto, server };
}

module.exports = { createGrpcServer, createGrpcService };
