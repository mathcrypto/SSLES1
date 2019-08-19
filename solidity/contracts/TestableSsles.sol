pragma solidity ^0.5.0;

import "./Ssles.sol";


contract TestableSsles is Ssles
{
    uint256[14] private m_vk;
    uint256[] private m_gammaAOnWithdraw
    C;

    constructor( uint256[14] memory in_vk, uint256[] memory in_gammaABC )
        public
    {
        m_vk = in_vk;
        m_gammaABC = in_gammaABC;
    }


    function TestVerify ( uint256[14] memory in_vk, uint256[] memory vk_gammaABC, uint256[8] memory in_proof, uint256[] memory proof_inputs )
        public view returns (bool)
    {
        return Verifier.Verify(in_vk, vk_gammaABC, in_proof, proof_inputs);
    }


    function GetVerifyingKey ()
        public view returns (uint256[14] memory out_vk, uint256[] memory out_gammaABC)
    {
        return (m_vk, m_gammaABC);
    }
}
