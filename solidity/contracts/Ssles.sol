pragma solidity ^0.5.0;

import "../../ethsnarks/contracts/Verifier.sol";
import "../../ethsnarks/contracts/MerkleTree.sol";
import "../../ethsnarks/contracts/MiMC.sol";


contract Ssles
{
    using MerkleTree for MerkleTree.Data;



    // Stores all of the valid merkle tree roots
    mapping (uint256 => bool) public roots;
    mapping (uint256 => bool) public nullifiers;


    MerkleTree.Data internal tree;


    /**
    * Used to be notified that a specific leaf has been broadcasted
    */
    event OnBroadcast( uint256 leaf_hash, uint256 leaf_index );

    event OnWithdraw(uint256 nullifier );
    /**
   
    /**
    * What is the current root for the merkle tree
    */
    function GetRoot()
    public view returns (uint256)
    {
        return tree.GetRoot();
    }


    /**
    * Returns leaf offset
    */
    function Broadcast(uint256 leaf)
    public payable returns (uint256 new_root, uint256 new_offset)
    {
        

        (new_root, new_offset) = tree.Insert(leaf);

        roots[new_root] = true;

        emit OnBroadcast(leaf, new_offset);
    }

    
    function MakeLeafHash(uint256 secret)
    public pure returns (uint256)
    {
        uint256[] memory vals = new uint256[](1);
        vals[0] = secret;
        return MiMC.Hash(vals);
    }
    
    function MakeMsgHash(uint256 msg)
    public pure returns (uint256)
    {
        uint256[] memory vals = new uint256[](1);
        vals[0] = msg;
        return MiMC.Hash(vals);
    }

    /**
    * Retrieve the merkle tree path for a specific leaf
    */
    function GetPath(uint256 in_leaf_index)
    public view returns (uint256[29] memory out_path, bool[29] memory out_addr)
    {
        return tree.GetProof(in_leaf_index);
    }


    function GetExtHash()
    public view returns (uint256)
    {
        return uint256(sha256(
            abi.encodePacked(
                address(this),
                msg.sender
                ))) % Verifier.ScalarField();
    }


    

    /**
    * Condense multiple public inputs down to a single one to be provided to the zkSNARK circuit
    */
    function HashPublicInputs(
        uint256 in_root,
        uint256 in_exthash,
        uint256 in_prehash
        )
    public pure returns (uint256)
    {
        uint256[] memory inputs_to_hash = new uint256[](3);

        inputs_to_hash[0] = in_root;
        inputs_to_hash[1] = in_exthash;
        inputs_to_hash[2] = in_prehash;

        return MiMC.Hash(inputs_to_hash);
    }


    function VerifyProof(
        uint256 in_root,
        uint256 in_exthash,
        uint256 in_prehash,
        uint256[8] memory proof
        )
    public view returns (bool)
    {
        // Public inputs for the zkSNARK circuit are hashed into a single input
        uint256[] memory snark_input = new uint256[](1);
        snark_input[0] = HashPublicInputs(in_root, in_exthash, in_prehash);

        // Retrieve verifying key
        uint256[14] memory vk;
        uint256[] memory vk_gammaABC;
        (vk, vk_gammaABC) = GetVerifyingKey();

        // Validate the proof
        return Verifier.Verify( vk, vk_gammaABC, proof, snark_input );
    }


    /**
    * Contracts which inherit this one must implement a mechanism to retrieve the verification key
    *
    * It is up to the implementor to figure out how to do this, but it could be hard-coded or
    * passed in via the constructor.
    *
    * See `TestableSsles` as an example, which loads the verification key from storage.
    */
    function GetVerifyingKey ()
    public view returns (uint256[14] memory out_vk, uint256[] memory out_gammaABC);
}

  
