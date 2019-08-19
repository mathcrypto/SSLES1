const TestableSsles = artifacts.require("TestableSsles");

const crypto = require("crypto");

const fs = require("fs");
const ffi = require("ffi");
const ref = require("ref");
const ArrayType = require("ref-array");
const BN = require("bn.js");

var StringArray = ArrayType(ref.types.CString);

const SslesVerifyingKeyPath = "../.keys/ssles.vk.json";
const SslesProvingKeyPath = "../.keys/ssles.pk.raw";

var libssles = ffi.Library("../.build/libssles", {
    // Retrieve depth of tree
    "ssles_tree_depth": [
    "size_t", []
    ],

    // Create a proof for the parameters
    "ssles_prove": [
    "string", [
            "string",       // pk_file
            "string",       // in_root
            "string",       // in_exthash
            "string",       // in_spend_pubkey
            "string",       // in_prehash
            "string",       // in_msg
            "string",       // in_address
            StringArray,    // in_path
            ]
            ],

    // Create a proof for the parameters (encoded as json)
    "ssles_prove_json": [
    "string", [
            "string",       // pk_file
            "string",       // args_json
            ]
            ],

    // Verify a proof
    "ssles_verify": [
    "bool", [
            "string",   // vk_json
            "string",   // proof_json
            ]
            ],

            
            
        });



let list_flatten = (l) => {
    return [].concat.apply([], l);
};


let vk_to_flat = (vk) => {
    return [
    list_flatten([
        vk.alpha[0], vk.alpha[1],
        list_flatten(vk.beta),
        list_flatten(vk.gamma),
        list_flatten(vk.delta),
        ]),
    list_flatten(vk.gammaABC)
    ];
};


let proof_to_flat = (proof) => {
    return list_flatten([
        proof.A,
        list_flatten(proof.B),
        proof.C
        ]);
};


contract("TestableSsles", () => {
    describe("Broadcast", () => {
        let obj;
        let secret;
        let msg;
        let sig_msg_hash;
        let leaf_hash;
        let proof_root;
        let proof_prehash;
        let proof;
        let new_root_and_offset;

        it("gets ready for broadcast", async () => {
            obj = await TestableSsles.deployed();

            // Parameters for broadcast
            secret = new BN(crypto.randomBytes(30).toString("hex"), 16);
            leaf_hash = await obj.MakeLeafHash.call(secret);

            msg = new BN(crypto.randomBytes(30).toString("hex"), 16);
            sig_msg_hash = await obj.MakeMsgHash.call(msg);


            // Perform broadcast
            new_root_and_offset = await obj.Broadcast.call(leaf_hash, {value: 1000000000000000000});
        });

        it("broadcasts", async () => {
            await obj.Broadcast.sendTransaction(leaf_hash, {value: 1000000000000000000});
        });

        it("construct arguments for withdraw", async () => {
         
            // Build parameters for proving
            let tmp = await obj.GetPath.call(new_root_and_offset[1]);
            let proof_address = tmp[1].map((_) => _ ? "1" : "0").join("");
            let proof_path = [];
            for( var i = 0; i < proof_address.length; i++ ) {
                proof_path.push( "0x" + tmp[0][i].toString(16) );
            }
            proof_root = await obj.GetRoot.call();
            // TODO: verify proof root equals expected one
            proof_root = new_root_and_offset[0];
            let leaf_index = new_root_and_offset[1];
            let proof_exthash = await obj.GetExtHash.call();
            let proof_prehash = sig_msg_hash;
            
            // TODO: verify proof msghash equals expected one prehash
            

            let proof_pub_hash = await obj.HashPublicInputs.call(proof_root, proof_exthash, proof_prehash);

            // Run prover to generate proof
            let proof_address_int = proof_address.split("").map((v, i) => (parseInt(v) ? Math.pow(2, i) : 0)).reduce(function(a, b) { return a + b; }, 0);
            let json_args = {
                'root': "0x" + proof_root.toString(16),
                'exthash': "0x" + proof_exthash.toString(16),
                'secret': "0x" + secret.toString(16),
                'msg': "0x" + msg.toString(16),
                'prehash': "0x" + proof_prehash.toString(16),
                'address': proof_address_int,
                'path': proof_path,
            };
            let proof_json = libssles.ssles_prove_json(SslesProvingKeyPath, JSON.stringify(json_args));

            // There *must* be JSON returned, containing the valid proof
            assert.notStrictEqual(proof_json, null);
            proof = JSON.parse(proof_json);

            // Ensure proof inputs match what is expected
            assert.strictEqual("0x" + proof_pub_hash.toString(16), proof.input[0]);

            // Re-verify proof using native library
            // XXX: node-ffi on OSX will not null-terminate strings returned from `readFileSync` !
            let vk_json = fs.readFileSync(SslesVerifyingKeyPath);
            let proof_valid_native = libssles.ssles_verify(vk_json + '\0', proof_json);
            assert.strictEqual(proof_valid_native, true);
            let vk = JSON.parse(vk_json);


            // Verify VK and Proof together
            let [vk_flat, vk_flat_IC] = vk_to_flat(vk);
            let test_verify_args = [
                vk_flat,                // (alpha, beta, gamma, delta)
                vk_flat_IC,             // gammaABC[]
                proof_to_flat(proof),   // A B C
                [  
                proof.input[0]
                ]
                ];
                let test_verify_result = await obj.TestVerify(...test_verify_args);
                assert.strictEqual(test_verify_result, true);


            // Verify whether or not our proof would be valid
            let proof_valid = await obj.VerifyProof.call(
                proof_root,
                proof_exthash,
                proof_prehash,
                proof_to_flat(proof));
            assert.strictEqual(proof_valid, true);


            
        });

        


        
    });
});
