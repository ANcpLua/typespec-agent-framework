// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT

using Microsoft.Agents.AI;                       // AgentResponseUpdate
using Microsoft.Agents.AI.Workflows.Declarative; // ResponseAgentProvider
using Microsoft.Extensions.AI;                   // ChatMessage

/// <summary>
/// Minimal <see cref="ResponseAgentProvider"/> stub. <c>DeclarativeWorkflowBuilder.Build</c>
/// parses the YAML and constructs the workflow graph; it never invokes the provider
/// (that happens at run time), so every member throws. Hand-rolled so the compiler
/// verifies the abstract surface against the pinned MAF version.
/// </summary>
internal sealed class StubResponseAgentProvider : ResponseAgentProvider
{
    public override Task<string> CreateConversationAsync(CancellationToken cancellationToken = default)
        => throw new NotSupportedException("workflow build does not invoke the agent provider");

    public override Task<ChatMessage> CreateMessageAsync(string conversationId, ChatMessage conversationMessage, CancellationToken cancellationToken = default)
        => throw new NotSupportedException();

    public override Task<ChatMessage> GetMessageAsync(string conversationId, string messageId, CancellationToken cancellationToken = default)
        => throw new NotSupportedException();

    public override IAsyncEnumerable<AgentResponseUpdate> InvokeAgentAsync(
        string agentId,
        string? agentVersion,
        string? conversationId,
        IEnumerable<ChatMessage>? messages,
        IDictionary<string, object?>? inputArguments,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException();

    public override IAsyncEnumerable<ChatMessage> GetMessagesAsync(
        string conversationId,
        int? limit = null,
        string? after = null,
        string? before = null,
        bool newestFirst = false,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException();
}
