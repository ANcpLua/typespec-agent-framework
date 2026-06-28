// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT

using Microsoft.Extensions.AI;

/// <summary>
/// Minimal <see cref="IChatClient"/> stub. <c>CreateFromYamlAsync</c> only builds the
/// agent definition — it never invokes the model — so the response methods are never
/// called. Hand-rolled (no Moq) so the compiler verifies the interface against the
/// pinned MAF / Microsoft.Extensions.AI versions.
/// </summary>
internal sealed class StubChatClient : IChatClient
{
    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("round-trip harness does not invoke the model");

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("round-trip harness does not invoke the model");

    public object? GetService(Type serviceType, object? serviceKey = null) => null;

    public void Dispose() { }
}
